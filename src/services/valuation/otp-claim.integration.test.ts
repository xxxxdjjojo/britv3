import { vi, describe, it, expect } from "vitest";

// Allow the server-only-guarded repo to load under vitest while keeping the
// production guard intact.
vi.mock("server-only", () => ({}));

// The global test setup stubs @supabase/supabase-js; this integration test needs
// the real client to talk to local Supabase.
vi.mock("@supabase/supabase-js", async (importOriginal) =>
  await importOriginal<typeof import("@supabase/supabase-js")>(),
);

import { createClient } from "@supabase/supabase-js";
import {
  createSession,
  saveAddress,
  saveDetails,
  saveResult,
  claimSessionToUser,
  getResultForUser,
} from "./session-repo";
import { MODEL_VERSION } from "@/lib/valuation/constants";
import type { ValuationResult, ValuationSubject, UserPropertyDetails } from "@/types/valuation";

/**
 * Proves OTP -> claim -> result against LOCAL Supabase using the real OTP
 * machinery (admin.generateLink yields the genuine email_otp; the public client
 * verifies it exactly as a user would). No email parsing needed.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon> \
 *   SUPABASE_SERVICE_ROLE_KEY=<local service> \
 *   RUN_VALUATION_LOCAL=1 npx vitest run src/services/valuation/otp-claim.integration.test.ts
 */
// Passed under LOCAL_* names because vitest.config.mts hardcodes NEXT_PUBLIC_*
// in its `env` block; we apply them to process.env at test time.
const LOCAL_URL = process.env.LOCAL_SUPABASE_URL;
const LOCAL_ANON = process.env.LOCAL_SUPABASE_ANON;
const LOCAL_SERVICE = process.env.LOCAL_SUPABASE_SERVICE;

const ENABLED =
  process.env.RUN_VALUATION_LOCAL === "1" &&
  Boolean(LOCAL_URL) &&
  Boolean(LOCAL_SERVICE) &&
  Boolean(LOCAL_ANON);

if (ENABLED) {
  // Override the test config's placeholder Supabase env so createAdminClient
  // (read at call time) talks to local Supabase.
  process.env.NEXT_PUBLIC_SUPABASE_URL = LOCAL_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = LOCAL_ANON;
  process.env.SUPABASE_SERVICE_ROLE_KEY = LOCAL_SERVICE;
}

const SUBJECT: ValuationSubject = {
  postcode: "SW18 4QN",
  outwardCode: "SW18",
  propertyType: "T",
  tenure: "F",
  newBuild: false,
  bedrooms: 3,
  bathrooms: 1,
  floorAreaSqm: null,
  condition: "average",
  paon: "11",
  saon: null,
  street: "DUNTSHILL ROAD",
};

const DETAILS: UserPropertyDetails = {
  subtype: "terraced",
  bedrooms: 3,
  bathrooms: 1,
  floorAreaSqm: null,
  tenure: "freehold",
  newBuild: false,
  condition: "average",
  hasExtensionOrLoft: false,
  parking: false,
  garden: true,
};

function syntheticResult(): ValuationResult {
  return {
    modelVersion: MODEL_VERSION,
    estimatedValue: 600000,
    estimatedLow: 540000,
    estimatedHigh: 660000,
    evidenceQuality: "medium",
    fallbackLevel: "C",
    comparableCount: 12,
    effectiveComparableCount: 9.4,
    valuationDate: "2026-06-18",
    dataCutoffDate: "2026-02-27",
    lastRegisteredSale: null,
    inputsUsed: ["propertyType", "tenure", "bedrooms"],
    missingInputs: ["floorAreaSqm"],
    limitations: ["Renovations and interior condition are not independently verified."],
    comparableSales: [],
  };
}

describe.runIf(ENABLED)("OTP -> claim -> result (local Supabase, real OTP)", () => {
  it("verifies a real OTP, claims the pending valuation, and enforces ownership", async () => {
    const admin = createClient(LOCAL_URL!, LOCAL_SERVICE!, { auth: { persistSession: false, autoRefreshToken: false } });
    const pub = createClient(LOCAL_URL!, LOCAL_ANON!, { auth: { persistSession: false, autoRefreshToken: false } });

    const stamp = Date.now();
    const email = `vmp-test-${stamp}@example.test`;

    // 1. Anonymous journey persists server-side.
    const { sessionId, token } = await createSession();
    await saveAddress(token, {
      postcode: "SW18 4QN", outwardCode: "SW18", paon: "11", saon: null,
      street: "DUNTSHILL ROAD", label: "11 DUNTSHILL ROAD",
    });
    await saveDetails(token, DETAILS);
    const resultId = await saveResult(sessionId, SUBJECT, syntheticResult());

    // 2. Real OTP: mint via admin (returns the genuine email_otp) then verify as a user.
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    expect(linkErr).toBeNull();
    const otp = link.properties?.email_otp;
    expect(otp).toMatch(/^\d{6}$/);

    const { data: verified, error: verifyErr } = await pub.auth.verifyOtp({
      email, token: otp!, type: "email",
    });
    expect(verifyErr).toBeNull();
    const user = verified.user;
    expect(user?.id).toBeTruthy();

    // 3. Claim attaches the pending valuation to the verified user.
    const claimedId = await claimSessionToUser(token, user!.id);
    expect(claimedId).toBe(resultId);

    // 4. Owner can read the result; a different user cannot.
    const owned = await getResultForUser(resultId, user!.id);
    expect(owned?.result.estimatedValue).toBe(600000);

    const otherUserId = "00000000-0000-4000-8000-0000000000aa";
    const denied = await getResultForUser(resultId, otherUserId);
    expect(denied).toBeNull();

    // cleanup
    await admin.auth.admin.deleteUser(user!.id).catch(() => undefined);
  });
});

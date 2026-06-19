import { vi, describe, it, expect } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", async (importOriginal) =>
  await importOriginal<typeof import("@supabase/supabase-js")>(),
);

import { createClient } from "@supabase/supabase-js";
import { createAgentLead } from "./agent-lead-service";

const LOCAL_URL = process.env.LOCAL_SUPABASE_URL;
const LOCAL_SERVICE = process.env.LOCAL_SUPABASE_SERVICE;
const ENABLED = process.env.RUN_VALUATION_LOCAL === "1" && Boolean(LOCAL_URL) && Boolean(LOCAL_SERVICE);

if (ENABLED) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = LOCAL_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = LOCAL_SERVICE;
}

describe.runIf(ENABLED)("createAgentLead (local Supabase)", () => {
  it("creates a lead + agent_contact consent only for the owner, and never marketing consent", async () => {
    const admin = createClient(LOCAL_URL!, LOCAL_SERVICE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const stamp = Date.now();
    const owner = (await admin.auth.admin.createUser({ email: `owner-${stamp}@example.test`, email_confirm: true })).data.user!;
    const other = (await admin.auth.admin.createUser({ email: `other-${stamp}@example.test`, email_confirm: true })).data.user!;

    const { data: result } = await admin
      .from("valuation_results")
      .insert({
        user_id: owner.id,
        model_version: "vmp-comparables-1.0.0",
        estimated_value: 600000,
        evidence_quality: "medium",
        fallback_level: "C",
        valuation_date: "2026-06-18",
      })
      .select("id")
      .single();
    const valuationId = result!.id as string;

    const input = {
      contactEmail: owner.email!,
      contactPhone: null,
      contactPreference: "email" as const,
      sellingTimeline: "0–3 months",
      noticeVersion: "test-notice",
      sourceRoute: "/test",
    };

    // A non-owner cannot create a lead for this valuation.
    const denied = await createAgentLead(other.id, valuationId, input);
    expect("error" in denied && denied.error).toBe("not_found");

    // The owner can — lead + consent recorded.
    const ok = await createAgentLead(owner.id, valuationId, input);
    expect("leadId" in ok).toBe(true);

    const { count: leadCount } = await admin
      .from("valuation_agent_leads")
      .select("*", { count: "exact", head: true })
      .eq("valuation_id", valuationId);
    expect(leadCount).toBe(1);

    const { data: consents } = await admin
      .from("valuation_consent_events")
      .select("purpose, consent_state")
      .eq("valuation_id", valuationId);
    expect(consents?.some((c) => c.purpose === "agent_contact" && c.consent_state === "granted")).toBe(true);
    // Critical: agent handoff must NOT create marketing consent.
    expect(consents?.some((c) => c.purpose.includes("marketing"))).toBe(false);

    await admin.auth.admin.deleteUser(owner.id).catch(() => undefined);
    await admin.auth.admin.deleteUser(other.id).catch(() => undefined);
  });
});

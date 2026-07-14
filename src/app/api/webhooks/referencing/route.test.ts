/**
 * Failure-mode tests for the referencing webhook route (PR 12 backfill).
 *
 * The referencing webhook is unauthenticated — trust comes solely from the
 * adapter's signature check on the RAW body. This file pins the security
 * contract that was previously untested:
 *
 *   - Invalid signature / unparseable payload → 400 with NO DB access at all.
 *   - Verified + matched external ref          → 200 { received: true }.
 *   - Verified + unknown external ref          → 200 { received: true, matched: false }
 *                                                (ack so the provider stops retrying).
 *   - Verified but the outcome write throws    → 500 (so the provider redelivers).
 *
 * Mirrors the mocking convention of webhooks/gocardless/route.test.ts. All test
 * data is synthetic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/services/referencing/referencing-service", () => ({
  getProvider: vi.fn(),
  applyReferencingOutcome: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import {
  getProvider,
  applyReferencingOutcome,
} from "@/services/referencing/referencing-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { POST } from "@/app/api/webhooks/referencing/route";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SIGNATURE = "b".repeat(64); // synthetic hex signature
const EXTERNAL_REF = "ref_synthetic_123";

function makeRequest(
  body: string,
  signature: string | null = SIGNATURE,
): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (signature !== null) headers["x-referencing-signature"] = signature;
  return new Request("http://localhost/api/webhooks/referencing", {
    method: "POST",
    headers,
    body,
  });
}

const parseWebhook = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getProvider).mockReturnValue({
    name: "mock",
    parseWebhook,
  } as never);
  vi.mocked(createAdminClient).mockReturnValue({} as never);
});

// ---------------------------------------------------------------------------
// 1. Signature verification — the security boundary
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/referencing — signature verification", () => {
  it("verifies the RAW body against the x-referencing-signature header", async () => {
    parseWebhook.mockReturnValue({ externalRef: EXTERNAL_REF, outcome: "passed" });
    vi.mocked(applyReferencingOutcome).mockResolvedValue({ matched: true });
    const rawBody = JSON.stringify({ ref: EXTERNAL_REF, result: "pass" });

    await POST(makeRequest(rawBody));

    expect(parseWebhook).toHaveBeenCalledWith(rawBody, SIGNATURE);
  });

  it("returns 400 and performs NO DB access when the signature is invalid", async () => {
    // Adapter rejects the payload/signature by returning null.
    parseWebhook.mockReturnValue(null);

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(400);
    // The signature gate must run before any admin client is created.
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(applyReferencingOutcome).not.toHaveBeenCalled();
  });

  it("falls back to the x-signature header when x-referencing-signature is absent", async () => {
    parseWebhook.mockReturnValue({ externalRef: EXTERNAL_REF, outcome: "passed" });
    vi.mocked(applyReferencingOutcome).mockResolvedValue({ matched: true });
    const req = new Request("http://localhost/api/webhooks/referencing", {
      method: "POST",
      headers: { "content-type": "application/json", "x-signature": SIGNATURE },
      body: "{}",
    });

    await POST(req);

    expect(parseWebhook).toHaveBeenCalledWith("{}", SIGNATURE);
  });
});

// ---------------------------------------------------------------------------
// 2. Outcome application
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/referencing — outcome application", () => {
  it("applies a verified outcome and returns 200 when the external ref matches", async () => {
    parseWebhook.mockReturnValue({ externalRef: EXTERNAL_REF, outcome: "passed" });
    vi.mocked(applyReferencingOutcome).mockResolvedValue({ matched: true });

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(applyReferencingOutcome).toHaveBeenCalledWith(
      expect.anything(),
      EXTERNAL_REF,
      "passed",
    );
  });

  it("acks an unknown external ref with 200 matched:false so the provider stops retrying", async () => {
    parseWebhook.mockReturnValue({ externalRef: "ref_unknown", outcome: "failed" });
    vi.mocked(applyReferencingOutcome).mockResolvedValue({ matched: false });

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, matched: false });
  });

  it("returns 500 (so the provider redelivers) when the outcome write throws", async () => {
    parseWebhook.mockReturnValue({ externalRef: EXTERNAL_REF, outcome: "passed" });
    vi.mocked(applyReferencingOutcome).mockRejectedValue(new Error("db down"));

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(500);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_SECRET = process.env.PUSH_SECRET;

describe("push HMAC auth", () => {
  beforeEach(() => {
    process.env.PUSH_SECRET = "test-secret";
    vi.resetModules();
  });
  afterEach(() => {
    process.env.PUSH_SECRET = ORIGINAL_SECRET;
    vi.useRealTimers();
  });

  it("verifies a correctly signed, fresh payload", async () => {
    const { signPushPayload, verifyPushSignature } = await import("./push-auth");
    const ts = String(Date.now());
    const body = JSON.stringify({ userId: "u", type: "new_message" });
    const sig = signPushPayload(ts, body);
    expect(verifyPushSignature(ts, body, sig)).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const { signPushPayload, verifyPushSignature } = await import("./push-auth");
    const ts = String(Date.now());
    const sig = signPushPayload(ts, "original");
    expect(verifyPushSignature(ts, "tampered", sig)).toBe(false);
  });

  it("rejects a stale timestamp (replay outside skew window)", async () => {
    const { signPushPayload, verifyPushSignature } = await import("./push-auth");
    const staleTs = String(Date.now() - 10 * 60 * 1000); // 10 min ago
    const body = "x";
    const sig = signPushPayload(staleTs, body);
    expect(verifyPushSignature(staleTs, body, sig)).toBe(false);
  });

  it("rejects missing signature or timestamp", async () => {
    const { verifyPushSignature } = await import("./push-auth");
    expect(verifyPushSignature(null, "x", "sig")).toBe(false);
    expect(verifyPushSignature(String(Date.now()), "x", null)).toBe(false);
  });

  it("rejects a signature made with a different secret", async () => {
    const { signPushPayload } = await import("./push-auth");
    const ts = String(Date.now());
    const sig = signPushPayload(ts, "body");
    process.env.PUSH_SECRET = "different-secret";
    vi.resetModules();
    const { verifyPushSignature } = await import("./push-auth");
    expect(verifyPushSignature(ts, "body", sig)).toBe(false);
  });
});

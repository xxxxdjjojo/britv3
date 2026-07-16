import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyDiditWebhook } from "./didit-webhook-verifier";

const SECRET = "whsec_test";
const NOW = 1_800_000_000;

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

describe("verifyDiditWebhook", () => {
  const body = JSON.stringify({ session_id: "sess-1", status: "Approved" });

  it("accepts a valid signature with a fresh timestamp", () => {
    expect(verifyDiditWebhook(body, sign(body), String(NOW), SECRET, NOW)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifyDiditWebhook(body + "x", sign(body), String(NOW), SECRET, NOW)).toBe(false);
  });

  it("rejects a wrong-length signature without throwing", () => {
    expect(verifyDiditWebhook(body, "abc123", String(NOW), SECRET, NOW)).toBe(false);
  });

  it("rejects a stale timestamp (> 5 minutes skew)", () => {
    expect(verifyDiditWebhook(body, sign(body), String(NOW - 301), SECRET, NOW)).toBe(false);
  });

  it("rejects missing signature or timestamp", () => {
    expect(verifyDiditWebhook(body, null, String(NOW), SECRET, NOW)).toBe(false);
    expect(verifyDiditWebhook(body, sign(body), null, SECRET, NOW)).toBe(false);
    expect(verifyDiditWebhook(body, sign(body), "not-a-number", SECRET, NOW)).toBe(false);
  });
});

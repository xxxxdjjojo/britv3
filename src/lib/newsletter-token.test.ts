import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateNewsletterToken,
  verifyNewsletterToken,
} from "@/lib/newsletter-token";

const EMAIL = "agent@example.com";
const AUDIENCE = "agent_briefing";

describe("newsletter-token", () => {
  beforeEach(() => {
    vi.stubEnv("UNSUBSCRIBE_TOKEN_SECRET", "test-secret-for-newsletter-tokens");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("round-trips a confirm token to its email and audience", () => {
    const token = generateNewsletterToken(EMAIL, AUDIENCE, "confirm");
    const result = verifyNewsletterToken(token, "confirm");

    expect(result).toEqual({ ok: true, email: EMAIL, audience: AUDIENCE });
  });

  it("round-trips an unsubscribe token", () => {
    const token = generateNewsletterToken(EMAIL, "landlord_diary", "unsubscribe");
    const result = verifyNewsletterToken(token, "unsubscribe");

    expect(result).toEqual({ ok: true, email: EMAIL, audience: "landlord_diary" });
  });

  it("rejects a confirm token presented as an unsubscribe token (purpose binding)", () => {
    const token = generateNewsletterToken(EMAIL, AUDIENCE, "confirm");
    const result = verifyNewsletterToken(token, "unsubscribe");

    expect(result).toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("rejects a malformed token", () => {
    expect(verifyNewsletterToken("not-a-token", "confirm")).toEqual({
      ok: false,
      reason: "malformed",
    });
    expect(verifyNewsletterToken("a.b.c", "confirm")).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("rejects a tampered signature", () => {
    const token = generateNewsletterToken(EMAIL, AUDIENCE, "confirm");
    const parts = token.split(".");
    const flipped = parts[3].endsWith("0") ? "1" : "0";
    const tampered = [...parts.slice(0, 3), parts[3].slice(0, -1) + flipped].join(".");

    expect(verifyNewsletterToken(tampered, "confirm")).toEqual({
      ok: false,
      reason: "invalid_signature",
    });
  });

  it("rejects a token whose email was swapped after signing", () => {
    const token = generateNewsletterToken(EMAIL, AUDIENCE, "confirm");
    const parts = token.split(".");
    parts[0] = Buffer.from("attacker@example.com").toString("base64url");

    expect(verifyNewsletterToken(parts.join("."), "confirm")).toEqual({
      ok: false,
      reason: "invalid_signature",
    });
  });

  it("expires a confirm token after 7 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));
    const token = generateNewsletterToken(EMAIL, AUDIENCE, "confirm");

    vi.setSystemTime(new Date("2026-07-08T00:00:01Z"));
    expect(verifyNewsletterToken(token, "confirm")).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("keeps an unsubscribe token valid past 7 days (365-day TTL)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));
    const token = generateNewsletterToken(EMAIL, AUDIENCE, "unsubscribe");

    vi.setSystemTime(new Date("2026-08-01T00:00:00Z"));
    expect(verifyNewsletterToken(token, "unsubscribe")).toEqual({
      ok: true,
      email: EMAIL,
      audience: AUDIENCE,
    });
  });
});

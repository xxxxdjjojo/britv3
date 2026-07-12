/**
 * Tests for the single-use provider-reference (vouch) invitation token lib.
 *
 * The raw token is a 256-bit random bearer secret emailed to a referee; only
 * its SHA-256 hash is stored in provider_references.invite_token_hash. There is
 * no signed claim, so plain SHA-256 (not HMAC) is the correct primitive here.
 */

import { describe, expect, it } from "vitest";

import {
  computeInviteExpiry,
  generateReferenceToken,
  hashReferenceToken,
  isInviteExpired,
  tokenHashesMatch,
} from "./reference-tokens";

describe("generateReferenceToken", () => {
  it("is URL-safe (no +, /, or = characters)", () => {
    const token = generateReferenceToken();
    expect(token).not.toMatch(/[+/=]/);
  });

  it("carries at least 256 bits of entropy (>= 43 base64url chars)", () => {
    // 32 random bytes -> 43 base64url chars (no padding).
    expect(generateReferenceToken().length).toBeGreaterThanOrEqual(43);
  });

  it("is unique across calls", () => {
    expect(generateReferenceToken()).not.toBe(generateReferenceToken());
  });
});

describe("hashReferenceToken", () => {
  it("is deterministic for the same input", () => {
    expect(hashReferenceToken("abc")).toBe(hashReferenceToken("abc"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashReferenceToken("abc")).not.toBe(hashReferenceToken("abd"));
  });

  it("returns a 64-character hex string", () => {
    const hash = hashReferenceToken("abc");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("tokenHashesMatch", () => {
  it("returns true for equal hashes", () => {
    const hash = hashReferenceToken("abc");
    expect(tokenHashesMatch(hash, hash)).toBe(true);
  });

  it("returns false for different hashes", () => {
    expect(
      tokenHashesMatch(hashReferenceToken("abc"), hashReferenceToken("xyz")),
    ).toBe(false);
  });

  it("returns false (without throwing) for unequal-length inputs", () => {
    expect(tokenHashesMatch("abcd", "abc")).toBe(false);
  });

  it("returns false (without throwing) for non-hex input", () => {
    const valid = hashReferenceToken("abc");
    expect(tokenHashesMatch(valid, "not-hex")).toBe(false);
  });

  it("returns false for garbage inputs that would decode to empty buffers", () => {
    // Buffer.from("zz", "hex") -> empty buffer; the length guard blocks this.
    expect(tokenHashesMatch("zz", "zz")).toBe(false);
  });

  it("matches a raw token against its own hash", () => {
    const raw = generateReferenceToken();
    expect(tokenHashesMatch(hashReferenceToken(raw), hashReferenceToken(raw))).toBe(
      true,
    );
  });
});

describe("computeInviteExpiry", () => {
  it("returns an ISO timestamp exactly `days` after the given `from`", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const expiry = computeInviteExpiry(30, from);
    expect(expiry).toBe("2026-01-31T00:00:00.000Z");
  });

  it("defaults `from` to now, producing a future timestamp", () => {
    const before = Date.now();
    const expiry = new Date(computeInviteExpiry(30)).getTime();
    expect(expiry).toBeGreaterThan(before);
  });
});

describe("isInviteExpired", () => {
  const now = new Date("2026-01-15T12:00:00.000Z");

  it("treats a null expiry as expired", () => {
    expect(isInviteExpired(null, now)).toBe(true);
  });

  it("returns true when the expiry is in the past", () => {
    expect(isInviteExpired("2026-01-15T11:59:59.000Z", now)).toBe(true);
  });

  it("returns false when the expiry is in the future", () => {
    expect(isInviteExpired("2026-01-15T12:00:01.000Z", now)).toBe(false);
  });

  it("treats an expiry equal to now as expired (boundary)", () => {
    expect(isInviteExpired(new Date(now), now)).toBe(true);
  });

  it("fails closed: treats a corrupt/unparseable timestamp as expired", () => {
    expect(isInviteExpired("not-a-date", now)).toBe(true);
  });
});

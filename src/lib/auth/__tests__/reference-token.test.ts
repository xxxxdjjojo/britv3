import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const TEST_SECRET = "test-reference-token-secret-32bytes00";

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    REFERENCE_TOKEN_SECRET: TEST_SECRET,
  };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  vi.restoreAllMocks();
});

describe("reference-token", () => {
  it("issueReferenceToken returns a non-empty string", async () => {
    const { issueReferenceToken } = await import("../reference-token");
    const token = issueReferenceToken("ref-123", "provider-456");
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    // Should contain at least one dot (encodedPayload.signature)
    expect(token).toContain(".");
  });

  it("verifyReferenceToken returns valid with correct referenceId and providerId", async () => {
    const { issueReferenceToken, verifyReferenceToken } = await import("../reference-token");
    const token = issueReferenceToken("ref-123", "provider-456");
    const result = verifyReferenceToken(token);
    expect(result).toEqual({
      valid: true,
      referenceId: "ref-123",
      providerId: "provider-456",
    });
  });

  it("rejects an expired token (31 days old)", async () => {
    const { issueReferenceToken, verifyReferenceToken } = await import("../reference-token");

    // Issue token at current time
    const token = issueReferenceToken("ref-123", "provider-456");

    // Advance time by 31 days
    const thirtyOneDays = 31 * 24 * 60 * 60 * 1000;
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + thirtyOneDays);

    const result = verifyReferenceToken(token);
    expect(result).toEqual({ valid: false });
  });

  it("rejects a tampered token (flipped character)", async () => {
    const { issueReferenceToken, verifyReferenceToken } = await import("../reference-token");
    const token = issueReferenceToken("ref-123", "provider-456");

    // Flip a character in the middle of the token
    const mid = Math.floor(token.length / 2);
    const flipped = token[mid] === "a" ? "b" : "a";
    const tampered = token.slice(0, mid) + flipped + token.slice(mid + 1);

    const result = verifyReferenceToken(tampered);
    expect(result).toEqual({ valid: false });
  });

  it("rejects an empty string", async () => {
    const { verifyReferenceToken } = await import("../reference-token");
    expect(verifyReferenceToken("")).toEqual({ valid: false });
  });

  it("rejects a string with no dots", async () => {
    const { verifyReferenceToken } = await import("../reference-token");
    expect(verifyReferenceToken("nodotshere")).toEqual({ valid: false });
  });

  it("rejects random garbage", async () => {
    const { verifyReferenceToken } = await import("../reference-token");
    expect(verifyReferenceToken("abc.def.ghi.jkl")).toEqual({ valid: false });
    expect(verifyReferenceToken("not-a-real-token.signature")).toEqual({ valid: false });
  });
});

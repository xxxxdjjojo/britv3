/**
 * Tests for the report embargo-preview token (domain-separated HMAC links).
 */

import { createHmac } from "crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  embargoSecret,
  signEmbargoToken,
  verifyEmbargoToken,
} from "./embargo-token";

const SECRET = "test-embargo-secret";
const REPORT_KEY = "renters-rights-gap";
const EDITION = "2026-q3";

describe("embargo token", () => {
  it("round-trips a valid token back to its report key and edition", () => {
    const token = signEmbargoToken(REPORT_KEY, EDITION, SECRET);
    expect(verifyEmbargoToken(token, SECRET)).toEqual({
      reportKey: REPORT_KEY,
      edition: EDITION,
    });
  });

  it("round-trips values containing dots and unicode (base64url payload parts)", () => {
    const token = signEmbargoToken("report.v2", "édition.2026", SECRET);
    expect(verifyEmbargoToken(token, SECRET)).toEqual({
      reportKey: "report.v2",
      edition: "édition.2026",
    });
  });

  it("rejects a token signed with a different secret", () => {
    const token = signEmbargoToken(REPORT_KEY, EDITION, SECRET);
    expect(verifyEmbargoToken(token, "other-secret")).toBeNull();
  });

  it("rejects a tampered report key", () => {
    const token = signEmbargoToken(REPORT_KEY, EDITION, SECRET);
    const [, editionPart, sig] = token.split(".");
    const forgedKey = Buffer.from("some-other-report", "utf8").toString("base64url");
    expect(verifyEmbargoToken(`${forgedKey}.${editionPart}.${sig}`, SECRET)).toBeNull();
  });

  it("rejects a tampered edition", () => {
    const token = signEmbargoToken(REPORT_KEY, EDITION, SECRET);
    const [keyPart, , sig] = token.split(".");
    const forgedEdition = Buffer.from("2027-q1", "utf8").toString("base64url");
    expect(verifyEmbargoToken(`${keyPart}.${forgedEdition}.${sig}`, SECRET)).toBeNull();
  });

  it("rejects a signature computed under a different HMAC domain", () => {
    const keyPart = Buffer.from(REPORT_KEY, "utf8").toString("base64url");
    const editionPart = Buffer.from(EDITION, "utf8").toString("base64url");
    const wrongDomainSig = createHmac("sha256", SECRET)
      .update(`invoice-pay:${keyPart}.${editionPart}`)
      .digest("hex");
    expect(
      verifyEmbargoToken(`${keyPart}.${editionPart}.${wrongDomainSig}`, SECRET),
    ).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyEmbargoToken("", SECRET)).toBeNull();
    expect(verifyEmbargoToken("no-dots", SECRET)).toBeNull();
    expect(verifyEmbargoToken("only.two", SECRET)).toBeNull();
    expect(verifyEmbargoToken("one.two.three.four", SECRET)).toBeNull();
    expect(verifyEmbargoToken("a..deadbeef", SECRET)).toBeNull();
    expect(verifyEmbargoToken("a.b.", SECRET)).toBeNull();
    expect(verifyEmbargoToken("a.b.not-hex", SECRET)).toBeNull();
    expect(verifyEmbargoToken("a.b.deadbeef", SECRET)).toBeNull();
  });
});

describe("embargoSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns QUOTE_SIGNING_SECRET when configured", () => {
    vi.stubEnv("QUOTE_SIGNING_SECRET", "configured-secret");
    expect(embargoSecret()).toBe("configured-secret");
  });

  it("throws when QUOTE_SIGNING_SECRET is missing", () => {
    vi.stubEnv("QUOTE_SIGNING_SECRET", "");
    expect(() => embargoSecret()).toThrow("QUOTE_SIGNING_SECRET is not configured");
  });
});

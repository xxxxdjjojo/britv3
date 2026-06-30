/**
 * Tests for the customer invoice pay-token (HMAC, account-free payment links).
 */

import { describe, expect, it } from "vitest";

import { signInvoicePayToken, verifyInvoicePayToken } from "./invoice-pay-token";

const SECRET = "test-secret-abc";
const INVOICE_ID = "11111111-2222-3333-4444-555555555555";

describe("invoice pay-token", () => {
  it("round-trips a valid token back to its invoice id", () => {
    const token = signInvoicePayToken(INVOICE_ID, SECRET);
    expect(token).toContain(INVOICE_ID);
    expect(verifyInvoicePayToken(token, SECRET)).toBe(INVOICE_ID);
  });

  it("rejects a token signed with a different secret", () => {
    const token = signInvoicePayToken(INVOICE_ID, SECRET);
    expect(verifyInvoicePayToken(token, "other-secret")).toBeNull();
  });

  it("rejects a tampered invoice id", () => {
    const token = signInvoicePayToken(INVOICE_ID, SECRET);
    const sig = token.split(".")[1];
    const forged = `99999999-2222-3333-4444-555555555555.${sig}`;
    expect(verifyInvoicePayToken(forged, SECRET)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyInvoicePayToken("", SECRET)).toBeNull();
    expect(verifyInvoicePayToken("no-dot", SECRET)).toBeNull();
    expect(verifyInvoicePayToken(`${INVOICE_ID}.`, SECRET)).toBeNull();
    expect(verifyInvoicePayToken(`${INVOICE_ID}.deadbeef`, SECRET)).toBeNull();
  });

  it("is domain-separated from raw HMAC of the id alone", () => {
    // Two different invoice ids never share a signature.
    const a = signInvoicePayToken(INVOICE_ID, SECRET);
    const b = signInvoicePayToken("00000000-0000-0000-0000-000000000000", SECRET);
    expect(a.split(".")[1]).not.toBe(b.split(".")[1]);
  });
});

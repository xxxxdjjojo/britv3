import { describe, it, expect } from "vitest";
import { signQuote, verifyQuote, QUOTE_SIGNING_FIELDS } from "./quote-signer";

const SECRET = "test-secret-32-bytes-exactly-here";

const quoteFields = {
  service_request_id: "rfq-abc-123",
  provider_id: "prov-xyz-456",
  total_amount: "250.00",
  scope_of_work: "Fix leaking bathroom pipe and test for leaks.",
  line_items: JSON.stringify([{ description: "Labour", unit_price: 250, quantity: 1, total: 250 }]),
};

describe("quote-signer", () => {
  describe("QUOTE_SIGNING_FIELDS", () => {
    it("exports the list of fields included in the signature", () => {
      expect(QUOTE_SIGNING_FIELDS).toEqual([
        "service_request_id",
        "provider_id",
        "total_amount",
        "scope_of_work",
        "line_items",
      ]);
    });
  });

  describe("signQuote", () => {
    it("returns a hex string", () => {
      const sig = signQuote(quoteFields, SECRET);
      expect(sig).toMatch(/^[0-9a-f]{64}$/);
    });

    it("produces the same signature for the same input", () => {
      const sig1 = signQuote(quoteFields, SECRET);
      const sig2 = signQuote(quoteFields, SECRET);
      expect(sig1).toBe(sig2);
    });

    it("produces different signatures for different total_amount", () => {
      const sig1 = signQuote(quoteFields, SECRET);
      const sig2 = signQuote({ ...quoteFields, total_amount: "999.00" }, SECRET);
      expect(sig1).not.toBe(sig2);
    });

    it("produces different signatures for different secrets", () => {
      const sig1 = signQuote(quoteFields, SECRET);
      const sig2 = signQuote(quoteFields, "other-secret");
      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verifyQuote", () => {
    it("returns true when signature matches", () => {
      const sig = signQuote(quoteFields, SECRET);
      expect(verifyQuote(quoteFields, sig, SECRET)).toBe(true);
    });

    it("returns false when total_amount was tampered", () => {
      const sig = signQuote(quoteFields, SECRET);
      const tampered = { ...quoteFields, total_amount: "1.00" };
      expect(verifyQuote(tampered, sig, SECRET)).toBe(false);
    });

    it("returns false when scope_of_work was tampered", () => {
      const sig = signQuote(quoteFields, SECRET);
      const tampered = { ...quoteFields, scope_of_work: "Do nothing" };
      expect(verifyQuote(tampered, sig, SECRET)).toBe(false);
    });

    it("returns false for an empty signature string", () => {
      expect(verifyQuote(quoteFields, "", SECRET)).toBe(false);
    });

    it("returns false for a null signature", () => {
      expect(verifyQuote(quoteFields, null, SECRET)).toBe(false);
    });
  });
});

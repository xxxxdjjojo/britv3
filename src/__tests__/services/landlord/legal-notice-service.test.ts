/**
 * Test stubs for legal-notice-service covering LD-10 Section 21 validation.
 * These are Wave 0 stubs — implementation ships in plan 14-10.
 */
import { describe, it } from "vitest";

describe("legal-notice-service", () => {
  describe("validateSection21Requirements", () => {
    it.todo(
      "returns valid: true when epc_provided, gas_safety_provided, deposit_scheme_reference all present",
    );
    it.todo("returns valid: false with error when epc_provided is false");
    it.todo(
      "returns valid: false with error when gas_safety_provided is false",
    );
    it.todo(
      "returns valid: false with error when deposit_scheme_reference is empty",
    );
  });
});

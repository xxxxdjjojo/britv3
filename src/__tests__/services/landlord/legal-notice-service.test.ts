/**
 * Tests for legal-notice-service covering LD-10 Section 21 validation.
 */
import { describe, it, expect } from "vitest";
import { validateSection21Requirements } from "@/services/landlord/legal-notice-service";

describe("legal-notice-service", () => {
  describe("validateSection21Requirements", () => {
    it("returns valid: true when epc_provided, gas_safety_provided, deposit_scheme_reference all present", () => {
      const result = validateSection21Requirements({
        epc_provided: true,
        gas_safety_provided: true,
        deposit_scheme_reference: "TDS123456",
        possession_date: "2026-06-01",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns valid: false with error when epc_provided is false", () => {
      const result = validateSection21Requirements({
        epc_provided: false,
        gas_safety_provided: true,
        deposit_scheme_reference: "TDS123456",
        possession_date: "2026-06-01",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/epc/i);
    });

    it("returns valid: false with error when gas_safety_provided is false", () => {
      const result = validateSection21Requirements({
        epc_provided: true,
        gas_safety_provided: false,
        deposit_scheme_reference: "TDS123456",
        possession_date: "2026-06-01",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/gas safety/i);
    });

    it("returns valid: false with error when deposit_scheme_reference is empty", () => {
      const result = validateSection21Requirements({
        epc_provided: true,
        gas_safety_provided: true,
        deposit_scheme_reference: "",
        possession_date: "2026-06-01",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/deposit/i);
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  VALID_ROLES,
  SLUG_TO_ROLE,
  resolveRoleSlug,
} from "@/app/(auth)/register/onboarding/[role]/slug-mapping";

describe("onboarding slug mapping", () => {
  describe("SLUG_TO_ROLE map", () => {
    it('maps "broker" to "mortgage_broker"', () => {
      expect(SLUG_TO_ROLE["broker"]).toBe("mortgage_broker");
    });

    it('maps "provider" to "service_provider"', () => {
      expect(SLUG_TO_ROLE["provider"]).toBe("service_provider");
    });
  });

  describe("resolveRoleSlug()", () => {
    it('resolves "broker" → "mortgage_broker"', () => {
      expect(resolveRoleSlug("broker")).toBe("mortgage_broker");
    });

    it('resolves "provider" → "service_provider"', () => {
      expect(resolveRoleSlug("provider")).toBe("service_provider");
    });

    it('passes "homebuyer" through unchanged', () => {
      expect(resolveRoleSlug("homebuyer")).toBe("homebuyer");
    });

    it('passes "landlord" through unchanged', () => {
      expect(resolveRoleSlug("landlord")).toBe("landlord");
    });

    it('passes other canonical roles through unchanged', () => {
      expect(resolveRoleSlug("renter")).toBe("renter");
      expect(resolveRoleSlug("seller")).toBe("seller");
      expect(resolveRoleSlug("agent")).toBe("agent");
      expect(resolveRoleSlug("mortgage_broker")).toBe("mortgage_broker");
      expect(resolveRoleSlug("service_provider")).toBe("service_provider");
    });
  });

  describe("VALID_ROLES list", () => {
    it("includes all seven canonical roles", () => {
      expect(VALID_ROLES).toContain("homebuyer");
      expect(VALID_ROLES).toContain("renter");
      expect(VALID_ROLES).toContain("seller");
      expect(VALID_ROLES).toContain("landlord");
      expect(VALID_ROLES).toContain("agent");
      expect(VALID_ROLES).toContain("service_provider");
      expect(VALID_ROLES).toContain("mortgage_broker");
    });

    it('does not contain the short slug "broker"', () => {
      // Ensures raw slugs are never treated as valid without resolution.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(VALID_ROLES).not.toContain("broker" as any);
    });

    it('does not contain the short slug "provider"', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(VALID_ROLES).not.toContain("provider" as any);
    });

    it("resolving an invalid slug still fails VALID_ROLES check", () => {
      const resolved = resolveRoleSlug("invalid_role");
      // resolveRoleSlug returns UserRole | null; null (or any non-valid role) must not pass the VALID_ROLES check.
      expect(resolved !== null && VALID_ROLES.includes(resolved)).toBe(false);
    });
  });
});

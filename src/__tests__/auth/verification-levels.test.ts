import { describe, it, expect } from "vitest";
import { computeVerificationLevel } from "@/services/auth/role-service";
import type { VerificationStage } from "@/types/auth";

describe("computeVerificationLevel", () => {
  it("returns 'basic' with no stages completed", () => {
    expect(computeVerificationLevel([])).toBe("basic");
  });

  it("returns 'basic' with only email", () => {
    expect(computeVerificationLevel(["email"])).toBe("basic");
  });

  it("returns 'standard' with email and phone", () => {
    expect(computeVerificationLevel(["email", "phone"])).toBe("standard");
  });

  it("returns 'enhanced' with email, phone, and identity", () => {
    expect(computeVerificationLevel(["email", "phone", "identity"])).toBe("enhanced");
  });

  it("returns 'professional' with all stages", () => {
    const allStages: VerificationStage[] = [
      "email",
      "phone",
      "identity",
      "insurance",
      "qualifications",
      "admin_review",
    ];
    expect(computeVerificationLevel(allStages)).toBe("professional");
  });

  it("returns correct level regardless of stage order", () => {
    expect(computeVerificationLevel(["phone", "email"])).toBe("standard");
  });

  it("returns 'basic' with phone only (missing email)", () => {
    expect(computeVerificationLevel(["phone"])).toBe("basic");
  });

  it("returns 'standard' with email, phone, and extra unrelated stages", () => {
    // If someone has email + phone + insurance but not identity, they are standard
    expect(computeVerificationLevel(["email", "phone", "insurance"])).toBe("standard");
  });
});

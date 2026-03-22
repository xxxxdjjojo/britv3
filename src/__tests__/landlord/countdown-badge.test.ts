import { describe, it, expect } from "vitest";
import { getCountdownVariant } from "@/components/landlord/ComplianceCountdownBadge";

describe("getCountdownVariant", () => {
  it("returns 'expired' for negative days", () => {
    expect(getCountdownVariant(-5)).toBe("expired");
  });
  it("returns 'expired' for 0 days", () => {
    expect(getCountdownVariant(0)).toBe("expired");
  });
  it("returns 'critical' for 1-7 days", () => {
    expect(getCountdownVariant(7)).toBe("critical");
  });
  it("returns 'warning' for 8-30 days", () => {
    expect(getCountdownVariant(21)).toBe("warning");
  });
  it("returns 'safe' for 31+ days", () => {
    expect(getCountdownVariant(45)).toBe("safe");
  });
});

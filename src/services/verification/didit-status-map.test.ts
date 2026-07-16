import { describe, expect, it } from "vitest";
import { mapDiditStatus } from "./didit-status-map";

describe("mapDiditStatus", () => {
  it.each([
    ["Not Started", "pending"],
    ["In Progress", "pending"],
    ["In Review", "pending"],
    ["Awaiting User", "pending"],
    ["Resubmitted", "pending"],
    ["Approved", "verified"],
    ["Declined", "failed"],
    ["Abandoned", "failed"],
    ["Expired", "failed"],
    ["Kyc Expired", "failed"],
  ] as const)("maps Didit status %s → %s", (diditStatus, expected) => {
    expect(mapDiditStatus(diditStatus)).toBe(expected);
  });

  it("returns undefined for null/undefined/empty", () => {
    expect(mapDiditStatus(null)).toBeUndefined();
    expect(mapDiditStatus(undefined)).toBeUndefined();
    expect(mapDiditStatus("")).toBeUndefined();
  });

  it("returns undefined for an unknown status (caller acks without writing)", () => {
    expect(mapDiditStatus("Something Else")).toBeUndefined();
  });

  it("is case-sensitive to Didit's exact casing (guards the KYC Expired regression)", () => {
    // Didit's real status is "Kyc Expired", not "KYC Expired".
    expect(mapDiditStatus("KYC Expired")).toBeUndefined();
    expect(mapDiditStatus("Kyc Expired")).toBe("failed");
  });
});

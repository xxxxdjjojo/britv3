/**
 * Tests for trust-score-service.
 *
 * Functions under contract:
 *  - computeTrustScore(steps: VerificationStepForScore[]): number
 */

import { describe, expect, it } from "vitest";
import { computeTrustScore } from "../trust-score-service";
import type { VerificationStepForScore } from "../trust-score-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_STEP_IDS = [
  "id_check",
  "insurance",
  "qualifications",
  "client_references",
  "peer_references",
];

function makeSteps(status: string): VerificationStepForScore[] {
  return ALL_STEP_IDS.map((stepId) => ({ stepId, status }));
}

// ---------------------------------------------------------------------------
// computeTrustScore
// ---------------------------------------------------------------------------

describe("computeTrustScore", () => {
  it("returns 100 when all steps are approved", () => {
    const steps = makeSteps("approved");
    expect(computeTrustScore(steps)).toBe(100);
  });

  it("returns 50 when all steps are submitted (partial credit)", () => {
    const steps = makeSteps("submitted");
    // id_check: floor(25*0.5)=12, insurance: 12, qualifications: floor(20*0.5)=10,
    // client_references: floor(15*0.5)=7, peer_references: 7
    // Total = 12 + 12 + 10 + 7 + 7 = 48
    expect(computeTrustScore(steps)).toBe(48);
  });

  it("returns 0 when all steps are not_started", () => {
    const steps = makeSteps("not_started");
    expect(computeTrustScore(steps)).toBe(0);
  });

  it("handles mixed statuses correctly", () => {
    const steps: VerificationStepForScore[] = [
      { stepId: "id_check", status: "approved" },      // 25
      { stepId: "insurance", status: "submitted" },     // floor(25*0.5) = 12
      { stepId: "qualifications", status: "not_started" }, // 0
      { stepId: "client_references", status: "approved" }, // 15
      { stepId: "peer_references", status: "not_started" }, // 0
    ];
    expect(computeTrustScore(steps)).toBe(52);
  });

  it("uses default weight of 10 for unknown stepId", () => {
    const steps: VerificationStepForScore[] = [
      { stepId: "unknown_step", status: "approved" },
    ];
    expect(computeTrustScore(steps)).toBe(10);
  });

  it("uses default weight of 10 for unknown stepId with submitted status", () => {
    const steps: VerificationStepForScore[] = [
      { stepId: "unknown_step", status: "submitted" },
    ];
    // floor(10 * 0.5) = 5
    expect(computeTrustScore(steps)).toBe(5);
  });

  it("caps score at 100 even if weights exceed it", () => {
    const steps: VerificationStepForScore[] = [
      ...makeSteps("approved"),
      { stepId: "extra_unknown", status: "approved" }, // +10
    ];
    expect(computeTrustScore(steps)).toBe(100);
  });

  it("returns 0 for an empty steps array", () => {
    expect(computeTrustScore([])).toBe(0);
  });
});

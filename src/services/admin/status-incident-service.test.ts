import { describe, expect, it } from "vitest";

import {
  classifyIncident,
  isValidStatusTransition,
  type IncidentStatus,
} from "./status-incident-service";

/**
 * Status-incident lifecycle logic (TDD, pure helpers only — DB access is
 * exercised by db-tests/status-incidents-rls.test.ts).
 */

describe("classifyIncident", () => {
  it("buckets resolved, scheduled, and everything-else-as-active", () => {
    expect(classifyIncident({ status: "resolved" })).toBe("resolved");
    expect(classifyIncident({ status: "scheduled" })).toBe("scheduled");
    expect(classifyIncident({ status: "investigating" })).toBe("active");
    expect(classifyIncident({ status: "identified" })).toBe("active");
    expect(classifyIncident({ status: "monitoring" })).toBe("active");
  });
});

describe("isValidStatusTransition", () => {
  it("allows the forward investigating → identified → monitoring → resolved path", () => {
    expect(isValidStatusTransition("investigating", "identified")).toBe(true);
    expect(isValidStatusTransition("identified", "monitoring")).toBe(true);
    expect(isValidStatusTransition("monitoring", "resolved")).toBe(true);
  });

  it("allows scheduled maintenance to start or resolve", () => {
    expect(isValidStatusTransition("scheduled", "investigating")).toBe(true);
    expect(isValidStatusTransition("scheduled", "resolved")).toBe(true);
  });

  it("allows a no-op (same status)", () => {
    for (const s of ["investigating", "resolved", "scheduled"] as IncidentStatus[]) {
      expect(isValidStatusTransition(s, s)).toBe(true);
    }
  });

  it("never reopens a resolved incident", () => {
    expect(isValidStatusTransition("resolved", "investigating")).toBe(false);
    expect(isValidStatusTransition("resolved", "monitoring")).toBe(false);
  });

  it("rejects skipping straight from investigating to scheduled", () => {
    expect(isValidStatusTransition("investigating", "scheduled")).toBe(false);
  });
});

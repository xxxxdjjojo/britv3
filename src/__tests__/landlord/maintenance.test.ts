import { describe, it, expect } from "vitest";
import {
  canTransitionTo,
  getValidNextStatuses,
} from "@/services/landlord/maintenance-service";
import type { MaintenanceStatus } from "@/types/landlord";
import { maintenanceRequestSchema } from "@/types/landlord";

// -- State machine tests ------------------------------------------------------

describe("canTransitionTo", () => {
  const validTransitions: [MaintenanceStatus, MaintenanceStatus][] = [
    ["new", "acknowledged"],
    ["acknowledged", "assigned"],
    ["acknowledged", "in_progress"],
    ["assigned", "in_progress"],
    ["in_progress", "resolved"],
    ["resolved", "closed"],
  ];

  it.each(validTransitions)(
    "allows %s -> %s",
    (from, to) => {
      expect(canTransitionTo(from, to)).toBe(true);
    },
  );

  const invalidTransitions: [MaintenanceStatus, MaintenanceStatus][] = [
    ["new", "assigned"],
    ["new", "in_progress"],
    ["new", "resolved"],
    ["new", "closed"],
    ["acknowledged", "new"],
    ["acknowledged", "resolved"],
    ["acknowledged", "closed"],
    ["assigned", "new"],
    ["assigned", "acknowledged"],
    ["assigned", "resolved"],
    ["assigned", "closed"],
    ["in_progress", "new"],
    ["in_progress", "acknowledged"],
    ["in_progress", "assigned"],
    ["in_progress", "closed"],
    ["resolved", "new"],
    ["resolved", "in_progress"],
    ["closed", "new"],
    ["closed", "acknowledged"],
    ["closed", "assigned"],
    ["closed", "in_progress"],
    ["closed", "resolved"],
  ];

  it.each(invalidTransitions)(
    "rejects %s -> %s",
    (from, to) => {
      expect(canTransitionTo(from, to)).toBe(false);
    },
  );
});

describe("getValidNextStatuses", () => {
  it("returns [acknowledged] for new", () => {
    expect(getValidNextStatuses("new")).toEqual(["acknowledged"]);
  });

  it("returns [assigned, in_progress] for acknowledged", () => {
    expect(getValidNextStatuses("acknowledged")).toEqual([
      "assigned",
      "in_progress",
    ]);
  });

  it("returns [in_progress] for assigned", () => {
    expect(getValidNextStatuses("assigned")).toEqual(["in_progress"]);
  });

  it("returns [resolved] for in_progress", () => {
    expect(getValidNextStatuses("in_progress")).toEqual(["resolved"]);
  });

  it("returns [closed] for resolved", () => {
    expect(getValidNextStatuses("resolved")).toEqual(["closed"]);
  });

  it("returns [] for closed", () => {
    expect(getValidNextStatuses("closed")).toEqual([]);
  });
});

// -- Zod schema validation tests ----------------------------------------------

describe("maintenanceRequestSchema", () => {
  it("accepts valid data", () => {
    const result = maintenanceRequestSchema.safeParse({
      title: "Leaking tap in kitchen",
      description: "The kitchen tap has been leaking since last week.",
      priority: "high",
    });
    expect(result.success).toBe(true);
  });

  it("defaults priority to medium", () => {
    const result = maintenanceRequestSchema.parse({
      title: "Broken window",
      description: "Window cracked during storm.",
    });
    expect(result.priority).toBe("medium");
  });

  it("rejects empty title", () => {
    const result = maintenanceRequestSchema.safeParse({
      title: "",
      description: "Some description",
      priority: "low",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = maintenanceRequestSchema.safeParse({
      title: "A".repeat(201),
      description: "Some description",
      priority: "low",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 2000 characters", () => {
    const result = maintenanceRequestSchema.safeParse({
      title: "Valid title",
      description: "A".repeat(2001),
      priority: "low",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = maintenanceRequestSchema.safeParse({
      title: "Valid title",
      description: "Valid description",
      priority: "critical",
    });
    expect(result.success).toBe(false);
  });

  it("accepts title at exactly 200 characters", () => {
    const result = maintenanceRequestSchema.safeParse({
      title: "A".repeat(200),
      description: "Valid description",
      priority: "emergency",
    });
    expect(result.success).toBe(true);
  });

  it("accepts description at exactly 2000 characters", () => {
    const result = maintenanceRequestSchema.safeParse({
      title: "Valid title",
      description: "A".repeat(2000),
    });
    expect(result.success).toBe(true);
  });
});

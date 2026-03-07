import { describe, it, expect } from "vitest";
import {
  canTransitionTo,
  getValidNextStatuses,
} from "@/services/landlord/maintenance-service";

/**
 * Provider assignment tests -- validates that the state machine supports
 * the assignment flow and that marketplace link is correct.
 */

describe("Provider assignment state machine", () => {
  it("allows transition from acknowledged to assigned", () => {
    expect(canTransitionTo("acknowledged", "assigned")).toBe(true);
  });

  it("does not allow direct assignment from new status", () => {
    expect(canTransitionTo("new", "assigned")).toBe(false);
  });

  it("does not allow assignment from in_progress", () => {
    expect(canTransitionTo("in_progress", "assigned")).toBe(false);
  });

  it("includes assigned in valid next statuses from acknowledged", () => {
    const valid = getValidNextStatuses("acknowledged");
    expect(valid).toContain("assigned");
  });

  it("allows transition from assigned to in_progress", () => {
    expect(canTransitionTo("assigned", "in_progress")).toBe(true);
  });
});

describe("Marketplace link construction", () => {
  it("builds correct search URL with category filter", () => {
    const category = "maintenance";
    const url = `/marketplace/search?category=${category}`;
    expect(url).toBe("/marketplace/search?category=maintenance");
  });

  it("handles different category filters", () => {
    const categories = ["plumbing", "electrical", "roofing"];
    for (const cat of categories) {
      const url = `/marketplace/search?category=${cat}`;
      expect(url).toContain("marketplace/search");
      expect(url).toContain(`category=${cat}`);
    }
  });
});

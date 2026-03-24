import { describe, it, expect } from "vitest";
import {
  canTransition,
  getValidNextStatuses,
  VALID_TRANSITIONS,
  type BookingStatus,
  type TransitionActor,
} from "./booking-state-machine";

describe("booking-state-machine", () => {
  describe("VALID_TRANSITIONS", () => {
    it("has exactly 12 valid transitions", () => {
      expect(VALID_TRANSITIONS).toHaveLength(12);
    });
  });

  describe("canTransition", () => {
    it("allows provider to confirm a pending booking", () => {
      const result = canTransition("pending_confirmation", "confirmed", "provider");
      expect(result.allowed).toBe(true);
      expect(result.requiresReason).toBe(false);
    });

    it("allows provider to decline a pending booking with reason required", () => {
      const result = canTransition("pending_confirmation", "declined", "provider");
      expect(result.allowed).toBe(true);
      expect(result.requiresReason).toBe(true);
    });

    it("allows user to cancel a pending booking", () => {
      const result = canTransition("pending_confirmation", "cancelled", "user");
      expect(result.allowed).toBe(true);
    });

    it("allows user to cancel a confirmed booking", () => {
      const result = canTransition("confirmed", "cancelled", "user");
      expect(result.allowed).toBe(true);
    });

    it("allows provider to mark confirmed as in_progress", () => {
      const result = canTransition("confirmed", "in_progress", "provider");
      expect(result.allowed).toBe(true);
    });

    it("allows provider to complete an in-progress booking", () => {
      const result = canTransition("in_progress", "completed", "provider");
      expect(result.allowed).toBe(true);
    });

    it("allows system to complete an in-progress booking", () => {
      const result = canTransition("in_progress", "completed", "system");
      expect(result.allowed).toBe(true);
    });

    it("rejects user trying to complete a pending booking", () => {
      const result = canTransition("pending_confirmation", "completed", "user");
      expect(result.allowed).toBe(false);
    });

    it("rejects transition to same status", () => {
      const result = canTransition("confirmed", "confirmed", "provider");
      expect(result.allowed).toBe(false);
    });

    it("rejects transition from completed status", () => {
      const result = canTransition("completed", "pending_confirmation", "system");
      expect(result.allowed).toBe(false);
    });

    it("rejects wrong actor for a valid transition", () => {
      // Only provider can confirm, not user
      const result = canTransition("pending_confirmation", "confirmed", "user");
      expect(result.allowed).toBe(false);
    });

    it("allows provider to transition in_progress to completing", () => {
      const result = canTransition("in_progress", "completing", "provider");
      expect(result.allowed).toBe(true);
      expect(result.requiresReason).toBe(false);
    });

    it("allows system to complete from completing", () => {
      const result = canTransition("completing", "completed", "system");
      expect(result.allowed).toBe(true);
      expect(result.requiresReason).toBe(false);
    });

    it("allows system to roll back completing to in_progress", () => {
      const result = canTransition("completing", "in_progress", "system");
      expect(result.allowed).toBe(true);
      expect(result.requiresReason).toBe(true);
    });

    it("does not allow user to transition to completing", () => {
      const result = canTransition("in_progress", "completing", "user");
      expect(result.allowed).toBe(false);
    });
  });

  describe("getValidNextStatuses", () => {
    it("returns valid next statuses for pending_confirmation as provider", () => {
      const statuses = getValidNextStatuses("pending_confirmation", "provider");
      expect(statuses).toContain("confirmed");
      expect(statuses).toContain("declined");
    });

    it("returns valid next statuses for pending_confirmation as user", () => {
      const statuses = getValidNextStatuses("pending_confirmation", "user");
      expect(statuses).toContain("cancelled");
      expect(statuses).not.toContain("confirmed");
    });

    it("returns empty array for completed status", () => {
      const statuses = getValidNextStatuses("completed", "provider");
      expect(statuses).toHaveLength(0);
    });

    it("returns empty array for cancelled status", () => {
      const statuses = getValidNextStatuses("cancelled", "user");
      expect(statuses).toHaveLength(0);
    });
  });
});

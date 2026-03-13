/**
 * Test stubs for tenant-application-service covering LD-04 state transitions.
 * These are Wave 0 stubs — implementation ships in plan 14-04.
 */
import { describe, it } from "vitest";

describe("tenant-application-service", () => {
  describe("acceptApplication", () => {
    it.todo("transitions status from 'referencing' to 'approved'");
    it.todo(
      "rejects invalid status transition (e.g. received -> approved directly)",
    );
    it.todo("sends acceptance email via Resend on approval");
  });

  describe("rejectApplication", () => {
    it.todo("transitions status to 'rejected' and records rejection_reason");
    it.todo("sends rejection email via Resend on rejection");
  });
});

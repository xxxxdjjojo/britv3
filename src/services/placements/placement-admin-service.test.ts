import { describe, expect, it } from "vitest";

import { reviewPatch } from "./placement-admin-service";

describe("reviewPatch", () => {
  it("approving activates and clears any rejection reason", () => {
    expect(reviewPatch({ type: "approve" })).toEqual({ status: "active", rejection_reason: null });
  });

  it("rejecting records the reason", () => {
    expect(reviewPatch({ type: "reject", reason: "Misleading claims" })).toEqual({
      status: "rejected",
      rejection_reason: "Misleading claims",
    });
  });

  it("pausing and resuming toggle status", () => {
    expect(reviewPatch({ type: "pause" })).toEqual({ status: "paused" });
    expect(reviewPatch({ type: "resume" })).toEqual({ status: "active" });
  });

  it("featuring sets the admin_featured pin", () => {
    expect(reviewPatch({ type: "feature", featured: true })).toEqual({ admin_featured: true });
  });

  it("override sets the priority value (including clearing it)", () => {
    expect(reviewPatch({ type: "override", priority: 100 })).toEqual({ priority_override: 100 });
    expect(reviewPatch({ type: "override", priority: null })).toEqual({ priority_override: null });
  });
});

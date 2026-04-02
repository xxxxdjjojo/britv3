import { describe, it, expect } from "vitest";

/**
 * Inbox redirect — verifies the role resolution and redirect logic.
 * The actual redirect is a server component using next/navigation, so we test
 * the pure logic: role fallback and URL construction.
 */

// ---------------------------------------------------------------------------
// Role resolution logic (mirrors /inbox/page.tsx)
// ---------------------------------------------------------------------------

function resolveRedirectUrl(activeRole: string | null | undefined): string {
  const role = activeRole ?? "homebuyer";
  return `/dashboard/${role}/messages`;
}

describe("inbox redirect URL resolution", () => {
  it("redirects to correct role messages page", () => {
    expect(resolveRedirectUrl("landlord")).toBe("/dashboard/landlord/messages");
  });

  it("redirects agent role correctly", () => {
    expect(resolveRedirectUrl("agent")).toBe("/dashboard/agent/messages");
  });

  it("redirects provider role correctly", () => {
    expect(resolveRedirectUrl("provider")).toBe("/dashboard/provider/messages");
  });

  it("falls back to homebuyer when active_role is null", () => {
    expect(resolveRedirectUrl(null)).toBe("/dashboard/homebuyer/messages");
  });

  it("falls back to homebuyer when active_role is undefined", () => {
    expect(resolveRedirectUrl(undefined)).toBe("/dashboard/homebuyer/messages");
  });

  it("handles all 7 roles", () => {
    const roles = ["homebuyer", "renter", "seller", "landlord", "agent", "provider", "admin"];
    for (const role of roles) {
      expect(resolveRedirectUrl(role)).toBe(`/dashboard/${role}/messages`);
    }
  });
});

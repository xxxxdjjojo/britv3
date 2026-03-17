import { describe, it, expect } from "vitest";
import { canUnlinkIdentity } from "@/lib/auth/last-provider-guard";
import type { UserIdentity } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeIdentity(
  provider: string,
  identityId: string,
): UserIdentity {
  return {
    identity_id: identityId,
    id: identityId,
    user_id: "user-1",
    provider,
    identity_data: {},
    last_sign_in_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("canUnlinkIdentity", () => {
  it("blocks when removing the only identity (OAuth, no email provider)", () => {
    const identities = [makeIdentity("google", "g-1")];
    const result = canUnlinkIdentity(identities, "g-1");

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("Cannot disconnect your only login method");
    }
  });

  it("blocks when removing the only identity even if it is email", () => {
    const identities = [makeIdentity("email", "e-1")];
    const result = canUnlinkIdentity(identities, "e-1");

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("Cannot disconnect your only login method");
    }
  });

  it("allows when there are 2+ identities", () => {
    const identities = [
      makeIdentity("google", "g-1"),
      makeIdentity("email", "e-1"),
    ];
    const result = canUnlinkIdentity(identities, "g-1");

    expect(result.allowed).toBe(true);
  });

  it("allows removing one OAuth when another OAuth remains", () => {
    const identities = [
      makeIdentity("google", "g-1"),
      makeIdentity("github", "gh-1"),
    ];
    const result = canUnlinkIdentity(identities, "g-1");

    expect(result.allowed).toBe(true);
  });

  it("blocks on empty identities array", () => {
    const result = canUnlinkIdentity([], "g-1");

    expect(result.allowed).toBe(false);
  });

  it("allows when removing OAuth and email provider remains", () => {
    const identities = [
      makeIdentity("email", "e-1"),
      makeIdentity("google", "g-1"),
    ];
    const result = canUnlinkIdentity(identities, "g-1");

    expect(result.allowed).toBe(true);
  });
});

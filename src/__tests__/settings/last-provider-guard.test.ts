import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Extract the last-provider guard logic into a pure function for testing.
// This mirrors the guard in /api/settings/connected DELETE handler.
// ---------------------------------------------------------------------------

type MinimalIdentity = { provider: string };

/**
 * Returns an error message if the user should be blocked from disconnecting,
 * or null if the operation is allowed.
 */
function lastProviderGuard(identities: MinimalIdentity[]): string | null {
  if (identities.length <= 1) {
    const hasEmailProvider = identities.some((i) => i.provider === "email");
    if (!hasEmailProvider) {
      return "Cannot disconnect your only login method. Set a password first.";
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("lastProviderGuard", () => {
  it("blocks when there is 1 identity and no email provider", () => {
    const identities = [{ provider: "google" }];
    const result = lastProviderGuard(identities);
    expect(result).toBe(
      "Cannot disconnect your only login method. Set a password first.",
    );
  });

  it("allows when there is 1 identity and it is email provider", () => {
    const identities = [{ provider: "email" }];
    const result = lastProviderGuard(identities);
    expect(result).toBeNull();
  });

  it("allows when there are 2+ identities", () => {
    const identities = [{ provider: "google" }, { provider: "github" }];
    const result = lastProviderGuard(identities);
    expect(result).toBeNull();
  });

  it("blocks when there are 0 identities (edge case)", () => {
    const identities: MinimalIdentity[] = [];
    const result = lastProviderGuard(identities);
    expect(result).toBe(
      "Cannot disconnect your only login method. Set a password first.",
    );
  });

  it("allows when there are 2+ identities including email", () => {
    const identities = [{ provider: "email" }, { provider: "google" }];
    const result = lastProviderGuard(identities);
    expect(result).toBeNull();
  });

  it("blocks when there is 1 non-email identity (e.g. github)", () => {
    const identities = [{ provider: "github" }];
    const result = lastProviderGuard(identities);
    expect(result).toBe(
      "Cannot disconnect your only login method. Set a password first.",
    );
  });
});

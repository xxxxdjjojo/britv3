import { describe, it, expect } from "vitest";
import { lastProviderGuard } from "@/lib/settings/last-provider-guard";

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
    const identities: { provider: string }[] = [];
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

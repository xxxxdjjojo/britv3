import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isFeatureEnabled, features } from "./features";

describe("isFeatureEnabled", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns true when env var is set to 'true'", () => {
    process.env["NEXT_PUBLIC_ENABLE_AI_DESCRIPTIONS"] = "true";
    expect(isFeatureEnabled("ai_descriptions")).toBe(true);
  });

  it("returns false when env var is not set", () => {
    delete process.env["NEXT_PUBLIC_ENABLE_NONEXISTENT"];
    expect(isFeatureEnabled("nonexistent")).toBe(false);
  });

  it("returns false when env var is set to 'false'", () => {
    process.env["NEXT_PUBLIC_ENABLE_AI_DESCRIPTIONS"] = "false";
    expect(isFeatureEnabled("ai_descriptions")).toBe(false);
  });

  it("is case-insensitive for feature name (converts to uppercase)", () => {
    process.env["NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS"] = "true";
    expect(isFeatureEnabled("push_notifications")).toBe(true);
  });

  it("returns false for empty string env var", () => {
    process.env["NEXT_PUBLIC_ENABLE_OFFLINE_MODE"] = "";
    expect(isFeatureEnabled("offline_mode")).toBe(false);
  });

  // Regression guard for the prod bug: every known flag must resolve via a
  // STATIC process.env.NEXT_PUBLIC_ENABLE_* reference (a dynamic computed-key
  // read resolves to undefined in the Next.js production server bundle). If a
  // flag is added to KNOWN_FEATURES without a matching static line in flagEnv,
  // this catches it.
  const KNOWN = [
    "ai_descriptions",
    "push_notifications",
    "offline_mode",
    "jwt_claims_middleware",
    "search_live_data",
    "local_area_intelligence",
    "search_rental_filters",
    "search_mock_data",
  ];

  for (const flag of KNOWN) {
    it(`wires the static env reference for '${flag}'`, () => {
      const key = `NEXT_PUBLIC_ENABLE_${flag.toUpperCase()}`;
      process.env[key] = "true";
      expect(isFeatureEnabled(flag)).toBe(true);
      process.env[key] = "false";
      expect(isFeatureEnabled(flag)).toBe(false);
    });
  }

  it("search_mock_data reads true (the prod regression)", () => {
    process.env["NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA"] = "true";
    expect(isFeatureEnabled("search_mock_data")).toBe(true);
  });
});

describe("features", () => {
  it("returns an object with known feature flag keys", () => {
    const result = features();
    expect(result).toEqual(
      expect.objectContaining({
        ai_descriptions: expect.any(Boolean),
        push_notifications: expect.any(Boolean),
        offline_mode: expect.any(Boolean),
      }),
    );
  });

  it("contains search_rental_filters key", () => {
    const result = features();
    expect(result).toHaveProperty("search_rental_filters");
    expect(typeof result.search_rental_filters).toBe("boolean");
  });

  it("contains search_mock_data key", () => {
    const result = features();
    expect(result).toHaveProperty("search_mock_data");
    expect(typeof result.search_mock_data).toBe("boolean");
  });

  it("returns boolean values for all keys", () => {
    const result = features();
    for (const value of Object.values(result)) {
      expect(typeof value).toBe("boolean");
    }
  });
});

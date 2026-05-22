// src/__tests__/lib/experiments.test.ts
//
// MEMO PIVOT v2 — PostHog experiment harness for the Sellers funnel A/B.

import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  SELLERS_DEFAULT_TIER_EXPERIMENT,
  resolveSellersDefaultTier,
  reportExperimentExposure,
  EXPERIMENT_VARIANTS,
} from "@/lib/experiments";

describe("SELLERS_DEFAULT_TIER_EXPERIMENT", () => {
  it("declares the feature flag name and variants", () => {
    expect(SELLERS_DEFAULT_TIER_EXPERIMENT.key).toBe("sellers_default_tier");
    expect(SELLERS_DEFAULT_TIER_EXPERIMENT.variants).toEqual(["basic", "plus"]);
    expect(SELLERS_DEFAULT_TIER_EXPERIMENT.controlVariant).toBe("basic");
  });
});

describe("EXPERIMENT_VARIANTS", () => {
  it("maps each declared variant to the corresponding seller plan id", () => {
    expect(EXPERIMENT_VARIANTS.basic).toBe("seller_basic");
    expect(EXPERIMENT_VARIANTS.plus).toBe("seller_plus");
  });
});

describe("resolveSellersDefaultTier", () => {
  it("returns control variant when no PostHog client is provided", () => {
    expect(resolveSellersDefaultTier(null)).toBe("basic");
    expect(resolveSellersDefaultTier(undefined)).toBe("basic");
  });

  it("returns the variant reported by PostHog", () => {
    const fakePostHog = {
      getFeatureFlag: vi.fn().mockReturnValue("plus"),
    };
    expect(resolveSellersDefaultTier(fakePostHog)).toBe("plus");
    expect(fakePostHog.getFeatureFlag).toHaveBeenCalledWith("sellers_default_tier");
  });

  it("falls back to control when PostHog returns an unknown variant", () => {
    const fakePostHog = {
      getFeatureFlag: vi.fn().mockReturnValue("bogus"),
    };
    expect(resolveSellersDefaultTier(fakePostHog)).toBe("basic");
  });
});

describe("reportExperimentExposure", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls posthog.capture exactly once with the right payload", () => {
    const capture = vi.fn();
    const posthog = { capture };
    reportExperimentExposure(posthog, "sellers_default_tier", "plus");
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(
      "$feature_flag_called",
      expect.objectContaining({
        $feature_flag: "sellers_default_tier",
        $feature_flag_response: "plus",
      }),
    );
  });

  it("is a no-op when no client is provided", () => {
    expect(() => reportExperimentExposure(null, "sellers_default_tier", "plus")).not.toThrow();
  });

  it("deduplicates within a single session", () => {
    const capture = vi.fn();
    const posthog = { capture };
    reportExperimentExposure(posthog, "sellers_default_tier", "plus", {
      sessionKey: "session-1",
    });
    reportExperimentExposure(posthog, "sellers_default_tier", "plus", {
      sessionKey: "session-1",
    });
    expect(capture).toHaveBeenCalledTimes(1);
  });
});

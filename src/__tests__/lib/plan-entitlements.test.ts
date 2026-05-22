// src/__tests__/lib/plan-entitlements.test.ts
import { describe, it, expect } from "vitest";
import { getEntitlementsForPlan, hasFeature, getMinimumPlanForFeature } from "@/lib/plan-entitlements";

describe("getEntitlementsForPlan", () => {
  it("provider_member gets 3 quotes but not unlimited", () => {
    const features = getEntitlementsForPlan("provider_member");
    expect(features.has("QUOTES_BASIC")).toBe(true);
    expect(features.has("QUOTES_UNLIMITED")).toBe(false);
  });

  it("provider_professional gets unlimited quotes and priority leads", () => {
    const features = getEntitlementsForPlan("provider_professional");
    expect(features.has("QUOTES_UNLIMITED")).toBe(true);
    expect(features.has("LEADS_PRIORITY")).toBe(true);
    expect(features.has("BOOKING_SYSTEM")).toBe(true);
  });

  it("provider_elite gets everything including API and white-label", () => {
    const features = getEntitlementsForPlan("provider_elite");
    expect(features.has("API_ACCESS")).toBe(true);
    expect(features.has("WHITE_LABEL")).toBe(true);
    expect(features.has("TEAM_MULTI_USER")).toBe(true);
    expect(features.has("SUPPORT_DEDICATED")).toBe(true);
  });

  it("agent_performance gets basic listings", () => {
    const features = getEntitlementsForPlan("agent_performance");
    expect(features.has("LISTINGS_25")).toBe(true);
    expect(features.has("LISTINGS_UNLIMITED")).toBe(false);
  });

  it("agent_professional gets unlimited listings and CRM", () => {
    const features = getEntitlementsForPlan("agent_professional");
    expect(features.has("LISTINGS_UNLIMITED")).toBe(true);
    expect(features.has("AGENT_CRM")).toBe(true);
  });

  it("agent_enterprise gets everything", () => {
    const features = getEntitlementsForPlan("agent_enterprise");
    expect(features.has("LISTINGS_MULTI_BRANCH")).toBe(true);
    expect(features.has("AGENT_API_ACCESS")).toBe(true);
    expect(features.has("AGENT_CUSTOM_BRANDING")).toBe(true);
  });

  it("null plan returns empty set", () => {
    const features = getEntitlementsForPlan(null);
    expect(features.size).toBe(0);
  });

  it("unknown plan returns empty set", () => {
    const features = getEntitlementsForPlan("nonexistent_plan");
    expect(features.size).toBe(0);
  });

  it("all paid plans include REFERRAL_PROGRAM", () => {
    for (const planId of [
      "provider_member",
      "provider_professional",
      "provider_elite",
      "agent_performance",
      "agent_professional",
      "agent_enterprise",
      "landlord_ess",
      "landlord_pro",
    ]) {
      expect(getEntitlementsForPlan(planId).has("REFERRAL_PROGRAM")).toBe(true);
    }
  });
});

// [ENG REVIEW 7A] — legacy plan ID alias resolution tests
describe("legacy plan ID aliases", () => {
  it("agent_basic resolves to agent_performance features", () => {
    const oldFeatures = getEntitlementsForPlan("agent_basic");
    const newFeatures = getEntitlementsForPlan("agent_performance");
    expect(oldFeatures).toEqual(newFeatures);
    expect(oldFeatures.has("LISTINGS_25")).toBe(true);
  });

  it("provider_starter resolves to provider_member features", () => {
    const oldFeatures = getEntitlementsForPlan("provider_starter");
    const newFeatures = getEntitlementsForPlan("provider_member");
    expect(oldFeatures).toEqual(newFeatures);
    expect(oldFeatures.has("QUOTES_BASIC")).toBe(true);
  });

  it("provider_growth resolves to provider_professional features", () => {
    const oldFeatures = getEntitlementsForPlan("provider_growth");
    const newFeatures = getEntitlementsForPlan("provider_professional");
    expect(oldFeatures).toEqual(newFeatures);
    expect(oldFeatures.has("QUOTES_UNLIMITED")).toBe(true);
  });
});

describe("hasFeature", () => {
  it("returns true when plan includes the feature", () => {
    expect(hasFeature("provider_elite", "API_ACCESS")).toBe(true);
  });

  it("returns false when plan does not include the feature", () => {
    expect(hasFeature("provider_member", "API_ACCESS")).toBe(false);
  });

  it("returns false for null plan", () => {
    expect(hasFeature(null, "API_ACCESS")).toBe(false);
  });
});

describe("getMinimumPlanForFeature", () => {
  // Memo pivot v2 — upgrade prompts surface canonical (currently buyable)
  // plan ids only. Legacy ids still resolve via getEntitlementsForPlan for
  // in-flight subscriptions, but they're no longer returned as suggestions.

  it("returns provider_listed for QUOTES_BASIC (lowest tier with feature)", () => {
    expect(getMinimumPlanForFeature("provider", "QUOTES_BASIC")).toBe("provider_listed");
  });

  it("returns provider_pro for BOOKING_SYSTEM", () => {
    expect(getMinimumPlanForFeature("provider", "BOOKING_SYSTEM")).toBe("provider_pro");
  });

  it("returns provider_elite for API_ACCESS", () => {
    expect(getMinimumPlanForFeature("provider", "API_ACCESS")).toBe("provider_elite");
  });

  it("returns null for unknown feature", () => {
    expect(getMinimumPlanForFeature("provider", "NONEXISTENT" as never)).toBeNull();
  });

  it("returns agent_pro for LISTINGS_UNLIMITED", () => {
    expect(getMinimumPlanForFeature("agent", "LISTINGS_UNLIMITED")).toBe("agent_pro");
  });
});

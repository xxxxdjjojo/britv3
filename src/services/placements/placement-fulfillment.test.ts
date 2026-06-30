import { describe, expect, it } from "vitest";

import { isPlacementCheckout, placementInsertFromMetadata } from "./placement-fulfillment";

describe("isPlacementCheckout", () => {
  it("recognises a placement subscription checkout", () => {
    expect(isPlacementCheckout({ mode: "subscription", metadata: { placement_intent: "1" } })).toBe(true);
  });

  it("ignores a base-plan subscription checkout", () => {
    expect(isPlacementCheckout({ mode: "subscription", metadata: { user_id: "u1" } })).toBe(false);
  });

  it("ignores a one-off payment checkout", () => {
    expect(isPlacementCheckout({ mode: "payment", metadata: { placement_intent: "1" } })).toBe(false);
  });
});

describe("placementInsertFromMetadata", () => {
  const now = new Date("2026-06-30T12:00:00Z");

  it("builds an active placement row from checkout metadata", () => {
    const row = placementInsertFromMetadata(
      {
        placement_intent: "1",
        provider_id: "pr1",
        product_id: "prod1",
        placement_type: "category_leader",
        category: "plumber",
        region_scope: "London",
        town: "Ealing",
        postcode_district: "",
        monthly_price_pence: "29900",
      },
      { subscriptionId: "sub_123", customerId: "cus_123", currentPeriodEnd: "2026-07-30T12:00:00Z" },
      now,
    );

    expect(row).toMatchObject({
      provider_id: "pr1",
      product_id: "prod1",
      placement_type: "category_leader",
      category: "plumber",
      region_scope: "London",
      town: "Ealing",
      status: "active",
      monthly_price_pence: 29900,
      stripe_subscription_id: "sub_123",
      stripe_customer_id: "cus_123",
    });
    expect(row.starts_at).toBe(now.toISOString());
    expect(row.postcode_district).toBeNull();
  });

  it("coerces empty optional targeting fields to null", () => {
    const row = placementInsertFromMetadata(
      {
        placement_intent: "1",
        provider_id: "pr1",
        product_id: "",
        placement_type: "town_boost",
        category: "",
        region_scope: "",
        town: "Manchester",
        postcode_district: "",
        monthly_price_pence: "6900",
      },
      { subscriptionId: "sub_9", customerId: "cus_9", currentPeriodEnd: null },
      now,
    );
    expect(row.category).toBeNull();
    expect(row.region_scope).toBeNull();
    expect(row.product_id).toBeNull();
    expect(row.town).toBe("Manchester");
  });
});

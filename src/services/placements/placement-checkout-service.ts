/**
 * placement-checkout-service.ts
 *
 * Orchestrates a boost purchase: verifies eligibility (verified + active base
 * subscription), enforces the slot cap, then opens a Stripe *subscription*
 * Checkout session (recurring, separate from the trader's base subscription).
 * The placement row is created later by the webhook on payment success.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getStripe } from "@/lib/stripe";
import { canPurchaseBoost, type SubscriptionStatus, type VerificationStatus } from "@/lib/placements/eligibility";
import type { PlacementProduct, SponsoredPlacement } from "@/types/sponsored-placements";

import { countActiveSlots, getProduct } from "./placement-product-service";
import { assertPurchaseAllowed, PlacementPurchaseError } from "./purchase-guard";

export { PlacementPurchaseError };

async function resolveEligibility(
  supabase: SupabaseClient,
  providerId: string,
): Promise<{ verificationStatus: VerificationStatus; subscriptionStatus: SubscriptionStatus }> {
  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("provider_verification_status").eq("id", providerId).maybeSingle(),
    supabase.from("subscriptions").select("status").eq("user_id", providerId).maybeSingle(),
  ]);
  return {
    verificationStatus: (profile?.provider_verification_status ?? "unverified") as VerificationStatus,
    subscriptionStatus: (sub?.status ?? "inactive") as SubscriptionStatus,
  };
}

export async function createPlacementCheckout(
  supabase: SupabaseClient,
  input: { providerId: string; productId: string; customerEmail?: string | null },
): Promise<{ checkout_url: string }> {
  const product = await getProduct(supabase, input.productId);
  if (!product) {
    throw new PlacementPurchaseError("product_unavailable", "Placement product not found.");
  }

  const { verificationStatus, subscriptionStatus } = await resolveEligibility(supabase, input.providerId);
  const eligibility = canPurchaseBoost({ verificationStatus, subscriptionStatus });
  const activeSlotCount = await countActiveSlots(supabase, product);

  assertPurchaseAllowed({
    productStatus: product.status,
    eligibility,
    activeSlotCount,
    slotLimit: product.slot_limit,
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const lineItem = buildLineItem(product);

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [lineItem],
    customer_email: input.customerEmail ?? undefined,
    metadata: {
      placement_intent: "1",
      provider_id: input.providerId,
      product_id: product.id,
      placement_type: product.placement_type,
      category: product.category ?? "",
      region_scope: product.region_scope ?? "",
      town: product.town ?? "",
      postcode_district: product.postcode_district ?? "",
      monthly_price_pence: String(product.monthly_price_pence),
    },
    success_url: `${origin}/dashboard/provider/boost?status=success`,
    cancel_url: `${origin}/dashboard/provider/boost?status=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe Checkout session created but no URL returned");
  }
  return { checkout_url: session.url };
}

function buildLineItem(product: PlacementProduct) {
  if (product.stripe_price_id) {
    return { price: product.stripe_price_id, quantity: 1 } as const;
  }
  return {
    price_data: {
      currency: "gbp",
      product_data: { name: product.name },
      unit_amount: product.monthly_price_pence,
      recurring: { interval: "month" as const },
    },
    quantity: 1,
  };
}

// ---------------------------------------------------------------------------
// Provider self-service: list + pause/resume/cancel
// ---------------------------------------------------------------------------

export async function listProviderPlacements(
  supabase: SupabaseClient,
  providerId: string,
): Promise<SponsoredPlacement[]> {
  const { data, error } = await supabase
    .from("sponsored_placements")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SponsoredPlacement[];
}

/** Pause or resume a placement the provider owns. RLS enforces ownership. */
export async function setProviderPlacementPaused(
  supabase: SupabaseClient,
  providerId: string,
  placementId: string,
  paused: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("sponsored_placements")
    .update({ status: paused ? "paused" : "active" })
    .eq("id", placementId)
    .eq("provider_id", providerId)
    .in("status", paused ? ["active"] : ["paused"]);
  if (error) throw new Error(error.message);
}

/**
 * Cancel a placement: stop the Stripe subscription and mark it cancelled.
 * RLS ensures the provider only touches their own rows.
 */
export async function cancelProviderPlacement(
  supabase: SupabaseClient,
  providerId: string,
  placementId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("sponsored_placements")
    .select("stripe_subscription_id")
    .eq("id", placementId)
    .eq("provider_id", providerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return;

  if (data.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(data.stripe_subscription_id);
    } catch (err) {
      // Only tolerate "already gone" — re-throw real failures so we never mark a
      // placement cancelled locally while Stripe keeps billing the provider.
      const code = (err as { code?: string })?.code;
      if (code !== "resource_missing") throw err;
    }
  }

  const { error: updErr } = await supabase
    .from("sponsored_placements")
    .update({ status: "cancelled" })
    .eq("id", placementId)
    .eq("provider_id", providerId);
  if (updErr) throw new Error(updErr.message);
}

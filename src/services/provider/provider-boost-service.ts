/**
 * provider-boost-service.ts
 *
 * Visibility boost management for the provider dashboard.
 * Providers can purchase featured placement, area spotlight, or category-top boosts
 * via Stripe Checkout. Active boost status is read from the provider_boosts table.
 *
 * Functions:
 *  - getActiveBoosts(supabase, providerId)
 *  - createBoostCheckout(providerId, config)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import type { BoostType, ProviderBoost } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Stripe client — server-only
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder") as unknown as Stripe;

// ---------------------------------------------------------------------------
// Input / return types
// ---------------------------------------------------------------------------

export type BoostCheckoutConfig = Readonly<{
  boost_type: BoostType;
  coverage_area?: string;
  duration_days: number;
  amount_pence: number;
}>;

export type BoostCheckoutResult = Readonly<{
  checkout_url: string;
}>;

// ---------------------------------------------------------------------------
// getActiveBoosts
// ---------------------------------------------------------------------------

/**
 * Returns all currently active boosts for the given provider.
 * Active = is_active = true AND ends_at > now().
 */
export async function getActiveBoosts(
  supabase: SupabaseClient,
  providerId: string,
): Promise<ProviderBoost[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("provider_boosts")
    .select("*")
    .eq("provider_id", providerId)
    .eq("is_active", true)
    .gt("ends_at", now)
    .order("ends_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProviderBoost[];
}

// ---------------------------------------------------------------------------
// createBoostCheckout
// ---------------------------------------------------------------------------

/**
 * Creates a Stripe Checkout session for a provider boost purchase.
 * Returns { checkout_url } which the client should redirect to.
 *
 * TODO: Wire up stripe webhook handler (checkout.session.completed) to:
 *   1. Insert a row into provider_boosts with is_active = true
 *   2. Set starts_at = now, ends_at = now + duration_days
 *   3. Store stripe_payment_intent_id from the session
 */
export async function createBoostCheckout(
  providerId: string,
  config: BoostCheckoutConfig,
): Promise<BoostCheckoutResult> {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const boostLabels: Record<BoostType, string> = {
    featured_profile: "Featured Profile Boost",
    area_spotlight: "Area Spotlight Boost",
    category_top: "Category Top Boost",
  };

  const label = boostLabels[config.boost_type];
  const daysLabel = `${config.duration_days} day${config.duration_days !== 1 ? "s" : ""}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `${label} — ${daysLabel}`,
            description: config.coverage_area
              ? `Coverage area: ${config.coverage_area}`
              : undefined,
          },
          unit_amount: config.amount_pence,
        },
        quantity: 1,
      },
    ],
    metadata: {
      provider_id: providerId,
      boost_type: config.boost_type,
      duration_days: String(config.duration_days),
      coverage_area: config.coverage_area ?? "",
    },
    success_url: `${origin}/dashboard/provider/boost/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/provider/boost`,
  });

  if (!session.url) {
    throw new Error("Stripe Checkout session created but no URL returned");
  }

  return { checkout_url: session.url };
}

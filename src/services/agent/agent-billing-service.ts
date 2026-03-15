/**
 * Agent billing service -- Stripe subscription management, feature boosts,
 * and API key generation/revocation.
 */

import Stripe from "stripe";
import { createHash, randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentApiKey } from "@/types/agent";

// ============================================================================
// Stripe helpers
// ============================================================================

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  return new Stripe(key);
}

// ============================================================================
// Subscription management
// ============================================================================

/**
 * Creates a Stripe Checkout session for a subscription plan.
 * Returns the checkout session URL for client-side redirect.
 */
export async function createCheckoutSession(
  agentId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: agentId,
    metadata: { agent_id: agentId },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return session.url;
}

/**
 * Creates a Stripe Customer Portal session for managing/cancelling subscriptions.
 * Looks up the Stripe customer ID from the user's profile.
 */
export async function getCustomerPortalUrl(
  supabase: SupabaseClient,
  agentId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", agentId)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found");
  }

  const customerId = (profile as { stripe_customer_id: string | null })
    .stripe_customer_id;

  if (!customerId) {
    throw new Error("No Stripe customer ID found — user has not subscribed yet");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Returns the current active Stripe subscription for the agent, or null if
 * no subscription exists.
 */
export async function getCurrentSubscription(
  supabase: SupabaseClient,
  agentId: string,
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", agentId)
    .single();

  if (error || !profile) return null;

  const customerId = (profile as { stripe_customer_id: string | null })
    .stripe_customer_id;

  if (!customerId) return null;

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  return subscriptions.data[0] ?? null;
}

/**
 * Creates a Stripe Checkout session for a one-time featured listing boost.
 */
export async function purchaseFeatureBoost(
  agentId: string,
  listingId: string,
  durationDays: number,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: agentId,
    metadata: {
      agent_id: agentId,
      listing_id: listingId,
      duration_days: String(durationDays),
      boost_type: "featured_listing",
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return session.url;
}

// ============================================================================
// API key management
// ============================================================================

/**
 * Generates a new API key, stores the SHA-256 hash, and returns the full key
 * exactly once. The raw key is never stored and cannot be retrieved again.
 */
export async function generateApiKey(
  supabase: SupabaseClient,
  agentId: string,
  name: string,
): Promise<string> {
  const rawKey = `brite_${randomUUID().replace(/-/g, "")}`;
  const keyPrefix = rawKey.slice(0, 8);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const { error } = await supabase.from("agent_api_keys").insert({
    agent_id: agentId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name,
    is_active: true,
    usage_count: 0,
    rate_limit_per_minute: 60,
  });

  if (error) throw error;

  // Return the raw key exactly once — this is the only time it is available
  return rawKey;
}

/**
 * Revokes an API key by setting is_active=false and recording revoked_at.
 */
export async function revokeApiKey(
  supabase: SupabaseClient,
  keyId: string,
  agentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("agent_api_keys")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
    })
    .eq("id", keyId)
    .eq("agent_id", agentId);

  if (error) throw error;
}

/**
 * Returns all API keys for an agent. The key_hash is excluded from the return
 * value — only key_prefix and metadata are returned.
 */
export async function getApiKeys(
  supabase: SupabaseClient,
  agentId: string,
): Promise<Omit<AgentApiKey, "key_hash">[]> {
  const { data, error } = await supabase
    .from("agent_api_keys")
    .select(
      "id, agent_id, key_prefix, name, rate_limit_per_minute, last_used_at, usage_count, is_active, created_at, revoked_at",
    )
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Omit<AgentApiKey, "key_hash">[];
}

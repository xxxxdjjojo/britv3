/**
 * Agent billing service.
 * Handles Stripe subscriptions, feature boosts, and API key management.
 * NOTE: Stripe is not currently installed. All Stripe functions throw a stub error.
 * Install stripe package and update imports when ready to activate.
 */

import { createHash, randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentApiKey } from "@/types/agent";

// ---------------------------------------------------------------------------
// Stripe stub
// Stripe is not listed in package.json. All Stripe-dependent functions below
// throw a descriptive error at runtime. Replace this stub block with:
//   import Stripe from "stripe";
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2025-01-27.acacia" });
// once the stripe package is installed.
// ---------------------------------------------------------------------------

function stripeNotConfigured(): never {
  throw new Error(
    "Stripe not configured: install the stripe package and set STRIPE_SECRET_KEY.",
  );
}

/**
 * Create a Stripe checkout session for a subscription plan.
 * Returns the checkout session URL.
 */
export async function createCheckoutSession(
  _agentId: string,
  _priceId: string,
  _successUrl: string,
  _cancelUrl: string,
): Promise<string> {
  stripeNotConfigured();
}

/**
 * Get a Stripe customer portal URL for the agent.
 */
export async function getCustomerPortalUrl(
  supabase: SupabaseClient,
  agentId: string,
  _returnUrl: string,
): Promise<string> {
  // Verify the agent exists before attempting Stripe call
  const { error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", agentId)
    .single();

  if (error) {
    throw new Error(`Agent not found: ${error.message}`);
  }

  stripeNotConfigured();
}

/**
 * Get the current active Stripe subscription for an agent.
 */
export async function getCurrentSubscription(
  supabase: SupabaseClient,
  agentId: string,
): Promise<null> {
  // Verify agent exists
  const { error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", agentId)
    .single();

  if (error) {
    throw new Error(`Agent not found: ${error.message}`);
  }

  stripeNotConfigured();
}

/**
 * Purchase a feature boost for a specific listing.
 * Returns a Stripe checkout session URL for a one-time payment.
 */
export async function purchaseFeatureBoost(
  _agentId: string,
  _listingId: string,
  _durationDays: number,
  _priceId: string,
  _successUrl: string,
  _cancelUrl: string,
): Promise<string> {
  stripeNotConfigured();
}

// ---------------------------------------------------------------------------
// API Key management (no Stripe dependency)
// ---------------------------------------------------------------------------

/**
 * Generate a new API key for an agent.
 * Stores only the SHA-256 hash and 8-char prefix.
 * Returns the full plaintext key once — it cannot be retrieved again.
 */
export async function generateApiKey(
  supabase: SupabaseClient,
  agentId: string,
  name: string,
): Promise<{ key: string; record: Omit<AgentApiKey, "key_hash"> }> {
  const rawKey = randomBytes(32).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.substring(0, 8);

  const { data, error } = await supabase
    .from("agent_api_keys")
    .insert({
      agent_id: agentId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name,
      rate_limit_per_minute: 60,
      usage_count: 0,
      is_active: true,
    })
    .select(
      "id, agent_id, key_prefix, name, rate_limit_per_minute, last_used_at, usage_count, is_active, created_at, revoked_at",
    )
    .single();

  if (error) {
    throw new Error(`Failed to generate API key: ${error.message}`);
  }

  return {
    key: rawKey,
    record: data as Omit<AgentApiKey, "key_hash">,
  };
}

/**
 * Revoke an API key by setting is_active=false and recording revoked_at.
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

  if (error) {
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }
}

/**
 * Get all API keys for an agent, excluding key_hash for security.
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

  if (error) {
    throw new Error(`Failed to get API keys: ${error.message}`);
  }

  return (data ?? []) as Omit<AgentApiKey, "key_hash">[];
}

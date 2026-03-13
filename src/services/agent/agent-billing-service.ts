/**
 * Agent billing service -- Stripe checkout stubs, API key management.
 *
 * NOTE: Stripe is not installed. All Stripe-related functions return
 * mock/stub data. Replace with real Stripe calls once the package
 * is added to the project.
 */

import { randomUUID, createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentApiKey } from "@/types/agent";

// -- Stripe stubs (package not installed) ------------------------------------

/**
 * Create a Stripe Checkout session (stub).
 */
export async function createCheckoutSession(
  _agentId: string,
  _priceId: string,
  successUrl: string,
  _cancelUrl: string,
): Promise<{ url: string }> {
  // TODO: Replace with real Stripe integration when stripe package is added
  return { url: `${successUrl}?session_id=stub_session_${randomUUID()}` };
}

/**
 * Get Stripe billing portal URL (stub).
 */
export async function getCustomerPortalUrl(
  _agentId: string,
): Promise<{ url: string }> {
  // TODO: Replace with real Stripe integration
  return { url: `/dashboard/agent/billing?portal=stub_${randomUUID()}` };
}

/**
 * Fetch the agent's current subscription data from their profile.
 */
export async function getCurrentSubscription(
  supabase: SupabaseClient,
  agentId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id, subscription_status, subscription_plan")
    .eq("id", agentId)
    .single();

  if (error) {
    // Profile may not have subscription columns yet -- return null
    return null;
  }

  const row = data as Record<string, unknown> | null;
  if (!row || !row.stripe_customer_id) {
    return null;
  }

  return row;
}

/**
 * Purchase a featured boost for a listing (stub).
 */
export async function purchaseFeatureBoost(
  _agentId: string,
  _listingId: string,
  _durationDays: number,
  _priceId: string,
): Promise<{ url: string }> {
  // TODO: Replace with real Stripe one-time payment
  return {
    url: `/dashboard/agent/billing?boost=stub_${randomUUID()}`,
  };
}

// -- API key management -------------------------------------------------------

/**
 * Generate a new API key for the agent.
 * Returns the full key exactly once; only the hash and prefix are stored.
 */
export async function generateApiKey(
  supabase: SupabaseClient,
  agentId: string,
  name: string,
): Promise<{ key: string; id: string }> {
  const fullKey = `bsa_${randomUUID().replace(/-/g, "")}`;
  const keyHash = createHash("sha256").update(fullKey).digest("hex");
  const keyPrefix = fullKey.substring(0, 8);

  const { data, error } = await supabase
    .from("agent_api_keys")
    .insert({
      agent_id: agentId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name,
      is_active: true,
      rate_limit_per_minute: 60,
      usage_count: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to generate API key: ${error.message}`);
  }

  return {
    key: fullKey,
    id: (data as AgentApiKey).id,
  };
}

/**
 * Revoke an API key by setting is_active=false and revoked_at=now.
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
 * List all API keys for an agent (prefix, name, status -- NOT the hash).
 */
export async function getApiKeys(
  supabase: SupabaseClient,
  agentId: string,
): Promise<
  Array<{
    id: string;
    key_prefix: string;
    name: string;
    is_active: boolean;
    usage_count: number;
    last_used_at: string | null;
    created_at: string;
    revoked_at: string | null;
  }>
> {
  const { data, error } = await supabase
    .from("agent_api_keys")
    .select(
      "id, key_prefix, name, is_active, usage_count, last_used_at, created_at, revoked_at",
    )
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch API keys: ${error.message}`);
  }

  return (data ?? []) as Array<{
    id: string;
    key_prefix: string;
    name: string;
    is_active: boolean;
    usage_count: number;
    last_used_at: string | null;
    created_at: string;
    revoked_at: string | null;
  }>;
}

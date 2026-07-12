/**
 * provider-display.ts
 *
 * Single canonical helper for resolving a provider's display name and humanised
 * trade for vouch/reference surfaces (invitation email + referee page). Kept in
 * one place so both callers stay in sync.
 *
 * - providerName: profiles.display_name, defaulting to "A trader".
 * - providerTrade: the first service_category humanised via CATEGORY_LABELS,
 *   falling back to service_provider_details.business_name, else undefined.
 *
 * The generated Supabase types don't cover these columns, so the reads use the
 * existing `as { … } | null` cast style.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { CATEGORY_LABELS } from "@/lib/marketplace/category-labels";
import type { ServiceCategory } from "@/types/marketplace";

export async function getProviderDisplay(
  supabase: SupabaseClient,
  providerId: string,
): Promise<{ providerName: string; providerTrade?: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", providerId)
    .maybeSingle();

  const { data: spd } = await supabase
    .from("service_provider_details")
    .select("services, business_name")
    .eq("user_id", providerId)
    .maybeSingle();

  const details = spd as
    | { services?: ServiceCategory[]; business_name?: string }
    | null;

  const providerName =
    (profile as { display_name?: string } | null)?.display_name ?? "A trader";

  // Derive the trade from the first service_category, humanised the same way
  // the rest of the marketplace renders it (CATEGORY_LABELS). Fall back to the
  // business name when the provider has no services listed.
  const firstService = details?.services?.[0];
  const providerTrade =
    (firstService ? CATEGORY_LABELS[firstService] : undefined) ??
    details?.business_name ??
    undefined;

  return providerTrade ? { providerName, providerTrade } : { providerName };
}

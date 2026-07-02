/**
 * RFQ (Request for Quote) service -- handles creation, retrieval, listing,
 * and provider matching for service requests.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RfqCreateInput,
  RfqGuestCreateInput,
} from "@/lib/validators/marketplace-schemas";
import {
  rfqCreateSchema,
  rfqGuestCreateSchema,
} from "@/lib/validators/marketplace-schemas";
import type { RfqStatus, ServiceRequest } from "@/types/marketplace";
import { geocodePostcode } from "@/services/geocoding/postcodes-io";
import { inngest } from "@/inngest/client";

const DEFAULT_EXPIRY_DAYS = 30;
const MAX_MATCHED_PROVIDERS = 10;

// -- Scoring weights for provider matching ------------------------------------
const SCORE_CATEGORY_MATCH = 50;
const SCORE_POSTCODE_OVERLAP = 30;
const SCORE_PROXIMITY = 20;
const SCORE_RATING_BONUS = 10;

type MatchedProvider = Readonly<{
  user_id: string;
  business_name: string;
  score: number;
}>;

/**
 * Create a new RFQ (service request).
 * Geocodes the postcode, inserts the RFQ, and dispatches an Inngest event
 * for async provider matching/notification.
 */
export async function createRfq(
  supabase: SupabaseClient,
  userId: string,
  data: RfqCreateInput,
): Promise<ServiceRequest> {
  const parsed = rfqCreateSchema.parse(data);

  // Geocode the property postcode
  const geo = await geocodePostcode(parsed.property_postcode);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS);

  const { data: rfq, error } = await supabase
    .from("service_requests")
    .insert({
      user_id: userId,
      service_category: parsed.service_category,
      title: parsed.title,
      description: parsed.description,
      property_address: parsed.property_address ?? null,
      property_postcode: parsed.property_postcode,
      property_location: geo
        ? `POINT(${geo.longitude} ${geo.latitude})`
        : null,
      preferred_start_date: parsed.preferred_start_date?.toISOString() ?? null,
      urgency_level: parsed.urgency_level,
      budget_min: parsed.budget_min ?? null,
      budget_max: parsed.budget_max ?? null,
      source: parsed.source ?? null,
      target_provider_id: parsed.target_provider_id ?? null,
      listing_id: parsed.listing_id ?? null,
      attachments: [],
      status: "open" as const,
      expires_at: expiresAt.toISOString(),
      view_count: 0,
      quote_count: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create RFQ: ${error.message}`);
  }

  // Dispatch async provider matching/notification via Inngest
  await inngest.send({
    name: "marketplace/rfq.created",
    data: { rfqId: rfq.id },
  });

  return rfq as ServiceRequest;
}

/**
 * Create an RFQ on behalf of a logged-out guest.
 * MUST be called with the service-role (admin) client — there is deliberately
 * no anon INSERT policy on service_requests. Quotes reach the guest by email.
 */
export async function createGuestRfq(
  supabase: SupabaseClient,
  data: RfqGuestCreateInput,
): Promise<ServiceRequest> {
  const parsed = rfqGuestCreateSchema.parse(data);

  const geo = await geocodePostcode(parsed.property_postcode);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS);

  const { data: rfq, error } = await supabase
    .from("service_requests")
    .insert({
      user_id: null,
      contact_name: parsed.contact_name,
      contact_email: parsed.contact_email,
      contact_phone: parsed.contact_phone ?? null,
      service_category: parsed.service_category,
      title: parsed.title,
      description: parsed.description,
      property_address: parsed.property_address ?? null,
      property_postcode: parsed.property_postcode,
      property_location: geo
        ? `POINT(${geo.longitude} ${geo.latitude})`
        : null,
      preferred_start_date: parsed.preferred_start_date?.toISOString() ?? null,
      urgency_level: parsed.urgency_level,
      budget_min: parsed.budget_min ?? null,
      budget_max: parsed.budget_max ?? null,
      source: parsed.source ?? null,
      target_provider_id: parsed.target_provider_id ?? null,
      listing_id: parsed.listing_id ?? null,
      attachments: [],
      status: "open" as const,
      expires_at: expiresAt.toISOString(),
      view_count: 0,
      quote_count: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create guest RFQ: ${error.message}`);
  }

  await inngest.send({
    name: "marketplace/rfq.created",
    data: { rfqId: rfq.id },
  });

  return rfq as ServiceRequest;
}

/**
 * Get a single RFQ by ID, with quote count.
 * RLS handles authorization.
 */
export async function getRfq(
  supabase: SupabaseClient,
  rfqId: string,
): Promise<ServiceRequest & { quotes_count: number }> {
  const { data, error } = await supabase
    .from("service_requests")
    .select("*, quotes(count)")
    .eq("id", rfqId)
    .single();

  if (error) {
    throw new Error(`Failed to get RFQ: ${error.message}`);
  }

  const quotesCount =
    Array.isArray(data.quotes) && data.quotes.length > 0
      ? (data.quotes[0] as { count: number }).count
      : 0;

  const { quotes, ...rfq } = data;
  return { ...rfq, quotes_count: quotesCount } as ServiceRequest & {
    quotes_count: number;
  };
}

/**
 * List RFQs created by a user, with optional status filter and pagination.
 */
export async function listUserRfqs(
  supabase: SupabaseClient,
  userId: string,
  status?: RfqStatus,
  limit = 20,
  offset = 0,
): Promise<{ data: ServiceRequest[]; count: number }> {
  let query = supabase
    .from("service_requests")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list user RFQs: ${error.message}`);
  }

  return { data: (data ?? []) as ServiceRequest[], count: count ?? 0 };
}

/**
 * List open RFQs that match a provider's service categories.
 * Filters by category overlap with the provider's services.
 */
export async function listProviderMatchedRfqs(
  supabase: SupabaseClient,
  providerId: string,
  limit = 20,
  offset = 0,
): Promise<{ data: ServiceRequest[]; count: number }> {
  // First get the provider's service categories
  const { data: provider, error: providerError } = await supabase
    .from("service_provider_details")
    .select("services")
    .eq("user_id", providerId)
    .single();

  if (providerError || !provider) {
    throw new Error("Provider not found or not a service provider");
  }

  const categories = (provider.services ?? []) as string[];

  // Category match applies ONLY to broadcast RFQs (no target) — an RFQ
  // targeted at THIS provider always surfaces, regardless of category and
  // even when the provider has no registered services yet.
  const broadcastArm =
    categories.length > 0
      ? `and(target_provider_id.is.null,service_category.in.(${categories.join(",")})),`
      : "";

  const { data, error, count } = await supabase
    .from("service_requests")
    .select("*", { count: "exact" })
    .eq("status", "open")
    .or(`${broadcastArm}target_provider_id.eq.${providerId}`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to list matched RFQs: ${error.message}`);
  }

  return { data: (data ?? []) as ServiceRequest[], count: count ?? 0 };
}

/**
 * Match and score providers for an RFQ.
 * Used internally by Inngest notification function.
 *
 * Scoring:
 * - Category match: 50 points
 * - Postcode overlap: 30 points
 * - Proximity (within radius): 20 points
 * - Rating bonus (4+ stars): 10 points
 *
 * Returns top 10 providers sorted by score descending.
 */
export async function matchProvidersForRfq(
  supabase: SupabaseClient,
  rfqId: string,
): Promise<MatchedProvider[]> {
  // Load the RFQ
  const { data: rfq, error: rfqError } = await supabase
    .from("service_requests")
    .select("*")
    .eq("id", rfqId)
    .single();

  if (rfqError || !rfq) {
    throw new Error(`RFQ not found: ${rfqId}`);
  }

  // Targeted RFQ: the buyer chose a specific trader — notify ONLY them.
  if (rfq.target_provider_id) {
    const { data: target } = await supabase
      .from("service_provider_details")
      .select("user_id, business_name")
      .eq("user_id", rfq.target_provider_id)
      .single();

    if (!target) return [];

    // Only notify a VERIFIED target — mirrors the RLS SELECT policy on
    // service_requests, which an unverified provider cannot pass anyway.
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("provider_verification_status")
      .eq("id", rfq.target_provider_id)
      .single();

    if (targetProfile?.provider_verification_status !== "verified") return [];
    return [
      {
        user_id: target.user_id as string,
        business_name: target.business_name as string,
        score: SCORE_CATEGORY_MATCH + SCORE_POSTCODE_OVERLAP + SCORE_PROXIMITY,
      },
    ];
  }

  // Find providers matching the category
  const { data: providers, error: providerError } = await supabase
    .from("service_provider_details")
    .select("user_id, business_name, services, service_postcodes, service_radius")
    .contains("services", [rfq.service_category]);

  if (providerError) {
    throw new Error(`Failed to find providers: ${providerError.message}`);
  }

  if (!providers || providers.length === 0) {
    return [];
  }

  // Get rating stats for matched providers
  const providerIds = providers.map(
    (p: { user_id: string }) => p.user_id,
  );
  const { data: ratingStats } = await supabase
    .from("provider_rating_stats")
    .select("provider_id, average_rating")
    .in("provider_id", providerIds);

  const ratingsMap = new Map<string, number>();
  if (ratingStats) {
    for (const stat of ratingStats) {
      ratingsMap.set(
        stat.provider_id as string,
        stat.average_rating as number,
      );
    }
  }

  // Extract RFQ postcode prefix for overlap check
  const rfqPostcodePrefix = (rfq.property_postcode as string)
    .trim()
    .split(" ")[0]
    .toUpperCase();

  // Score each provider
  const scored: MatchedProvider[] = providers.map(
    (provider: {
      user_id: string;
      business_name: string;
      services: string[];
      service_postcodes: string[];
      service_radius: number;
    }) => {
      let score = 0;

      // Category match (always true since we filtered by contains)
      score += SCORE_CATEGORY_MATCH;

      // Postcode overlap: check if any service postcode prefix matches RFQ postcode prefix
      const servicePostcodes = (provider.service_postcodes ?? []) as string[];
      const hasPostcodeOverlap = servicePostcodes.some((pc: string) =>
        pc.trim().toUpperCase().startsWith(rfqPostcodePrefix),
      );
      if (hasPostcodeOverlap) {
        score += SCORE_POSTCODE_OVERLAP;
      }

      // Proximity: if provider has a service radius, assume they cover the area
      // (full PostGIS distance check would need property_location and base_location)
      if (provider.service_radius && provider.service_radius > 0) {
        score += SCORE_PROXIMITY;
      }

      // Rating bonus: 4+ average rating
      const rating = ratingsMap.get(provider.user_id);
      if (rating && rating >= 4) {
        score += SCORE_RATING_BONUS;
      }

      return {
        user_id: provider.user_id,
        business_name: provider.business_name,
        score,
      };
    },
  );

  // Sort by score descending, take top 10
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_MATCHED_PROVIDERS);
}

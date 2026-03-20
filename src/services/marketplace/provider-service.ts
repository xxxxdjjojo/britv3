/**
 * Provider profile service layer.
 * Handles CRUD, search, and document upload for service providers.
 * All functions accept a Supabase client as first parameter.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProviderProfileInput,
  ProviderSearchInput,
} from "@/lib/validators/marketplace-schemas";
import type {
  ServiceProviderDetails,
  ProviderDocument,
  VerificationDocumentType,
} from "@/types/marketplace";
import { providerProfileSchema } from "@/lib/validators/marketplace-schemas";
import { validateFile, sanitizeBuffer } from "@/lib/marketplace/file-validator";
import { geocodePostcode } from "@/services/geocoding/postcodes-io";

// -- Slug generation ---------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(
  supabase: SupabaseClient,
  businessName: string
): Promise<string> {
  const base = slugify(businessName);

  // Check if base slug exists
  const { data: existing } = await supabase
    .from("service_provider_details")
    .select("slug")
    .eq("slug", base)
    .maybeSingle();

  if (!existing) {
    return base;
  }

  // Append incrementing suffix until unique
  let suffix = 2;
  let candidate = `${base}-${suffix}`;

  while (true) {
    const { data: check } = await supabase
      .from("service_provider_details")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();

    if (!check) {
      return candidate;
    }

    suffix++;
    candidate = `${base}-${suffix}`;
  }
}

// -- Provider profile CRUD ---------------------------------------------------

/**
 * Create a new provider profile with generated slug and geocoded base location.
 */
export async function createProviderProfile(
  supabase: SupabaseClient,
  userId: string,
  data: ProviderProfileInput
): Promise<ServiceProviderDetails> {
  const validated = providerProfileSchema.parse(data);
  const slug = await generateUniqueSlug(supabase, validated.business_name);

  // Geocode first service postcode for base_location
  let baseLocation: string | null = null;
  if (validated.service_postcodes.length > 0) {
    const geo = await geocodePostcode(validated.service_postcodes[0]);
    if (geo) {
      // PostGIS point format: SRID=4326;POINT(lng lat)
      baseLocation = `SRID=4326;POINT(${geo.longitude} ${geo.latitude})`;
    }
  }

  const { data: created, error } = await supabase
    .from("service_provider_details")
    .insert({
      user_id: userId,
      business_name: validated.business_name,
      business_description: validated.business_description,
      trading_name: validated.trading_name ?? null,
      company_number: validated.company_number ?? null,
      vat_number: validated.vat_number ?? null,
      services: validated.services,
      service_postcodes: validated.service_postcodes,
      service_radius: validated.service_radius,
      base_location: baseLocation,
      pricing: validated.pricing ?? {},
      website_url: validated.website_url || null,
      years_in_business: validated.years_in_business,
      slug,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create provider profile: ${error.message}`);
  }

  return created as ServiceProviderDetails;
}

/**
 * Update an existing provider profile. Regenerates slug if business_name changed.
 */
export async function updateProviderProfile(
  supabase: SupabaseClient,
  userId: string,
  data: Partial<ProviderProfileInput>
): Promise<ServiceProviderDetails> {
  const updateData: Record<string, unknown> = { ...data };

  // Regenerate slug if business_name changed
  if (data.business_name) {
    updateData.slug = await generateUniqueSlug(supabase, data.business_name);
  }

  // Clean up empty optional fields
  if ("website_url" in updateData && updateData.website_url === "") {
    updateData.website_url = null;
  }

  const { data: updated, error } = await supabase
    .from("service_provider_details")
    .update(updateData)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update provider profile: ${error.message}`);
  }

  return updated as ServiceProviderDetails;
}

/**
 * Get a provider's public profile by slug, including rating stats.
 */
export async function getProviderBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<(ServiceProviderDetails & { rating_stats: unknown }) | null> {
  const { data, error } = await supabase
    .from("service_provider_details")
    .select(`
      *,
      profiles!inner(full_name, avatar_url, provider_verification_status),
      provider_rating_stats(*)
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get provider by slug: ${error.message}`);
  }

  return data ?? null;
}

/**
 * Get own provider profile by user_id.
 */
export async function getProviderProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ServiceProviderDetails | null> {
  const { data, error } = await supabase
    .from("service_provider_details")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get provider profile: ${error.message}`);
  }

  return data ?? null;
}

// -- Provider search ---------------------------------------------------------

export type ProviderSearchResult = Readonly<{
  data: ServiceProviderDetails[];
  count: number;
}>;

/**
 * Search providers via the search_providers() RPC function.
 * If postcode provided, geocodes it first for geospatial filtering.
 */
export async function searchProviders(
  supabase: SupabaseClient,
  params: ProviderSearchInput
): Promise<ProviderSearchResult> {
  const rpcParams: Record<string, unknown> = {};

  if (params.service_category) {
    rpcParams.p_service_category = params.service_category;
  }

  if (params.postcode && params.postcode !== "") {
    const geo = await geocodePostcode(params.postcode);
    if (geo) {
      rpcParams.p_latitude = geo.latitude;
      rpcParams.p_longitude = geo.longitude;
      rpcParams.p_radius_miles = params.radius ?? 25;
    }
  }

  if (params.min_rating) {
    rpcParams.p_min_rating = params.min_rating;
  }

  if (params.search_query) {
    rpcParams.p_search_query = params.search_query;
  }

  const { data, error } = await supabase.rpc("search_providers", rpcParams);

  if (error) {
    throw new Error(`Provider search failed: ${error.message}`);
  }

  const results = (data ?? []) as ServiceProviderDetails[];

  // Application-level sorting (RPC does not support sort parameter)
  if (params.sort) {
    const sorted = [...results];
    switch (params.sort) {
      case "rating":
        sorted.sort((a, b) => {
          const ra = (a as unknown as Record<string, unknown>).avg_rating as number | null;
          const rb = (b as unknown as Record<string, unknown>).avg_rating as number | null;
          return (rb ?? 0) - (ra ?? 0);
        });
        break;
      case "reviews":
        sorted.sort((a, b) => {
          const ra = (a as unknown as Record<string, unknown>).total_reviews as number | null;
          const rb = (b as unknown as Record<string, unknown>).total_reviews as number | null;
          return (rb ?? 0) - (ra ?? 0);
        });
        break;
      case "newest":
        sorted.sort((a, b) => {
          const da = (a as unknown as Record<string, unknown>).created_at as string | null;
          const db = (b as unknown as Record<string, unknown>).created_at as string | null;
          return new Date(db ?? 0).getTime() - new Date(da ?? 0).getTime();
        });
        break;
      case "price_low":
        sorted.sort((a, b) => {
          const pa = ((a as unknown as Record<string, unknown>).pricing as Record<string, number> | null)?.hourly_rate ?? Infinity;
          const pb = ((b as unknown as Record<string, unknown>).pricing as Record<string, number> | null)?.hourly_rate ?? Infinity;
          return pa - pb;
        });
        break;
      case "price_high":
        sorted.sort((a, b) => {
          const pa = ((a as unknown as Record<string, unknown>).pricing as Record<string, number> | null)?.hourly_rate ?? 0;
          const pb = ((b as unknown as Record<string, unknown>).pricing as Record<string, number> | null)?.hourly_rate ?? 0;
          return pb - pa;
        });
        break;
    }
    return { data: sorted, count: sorted.length };
  }

  return {
    data: results,
    count: results.length,
  };
}

// -- Document upload ---------------------------------------------------------

/**
 * Upload a provider verification document with magic-bytes validation.
 * Stores file in Supabase Storage and records metadata in provider_documents.
 */
export async function uploadProviderDocument(
  supabase: SupabaseClient,
  userId: string,
  file: Buffer,
  documentType: VerificationDocumentType,
  originalFilename: string
): Promise<ProviderDocument> {
  // Validate file via magic bytes
  const { mime, ext } = await validateFile(file);
  const sanitized = await sanitizeBuffer(file, mime);

  const timestamp = Date.now();
  const storagePath = `provider-documents/${userId}/${documentType}/${timestamp}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("provider-docs")
    .upload(storagePath, sanitized, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`File upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("provider-docs")
    .getPublicUrl(storagePath);

  // Insert document record
  const { data: doc, error: insertError } = await supabase
    .from("provider_documents")
    .insert({
      user_id: userId,
      document_type: documentType,
      file_name: originalFilename,
      file_url: urlData.publicUrl,
      file_size: sanitized.length,
      mime_type: mime,
      verification_status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to save document record: ${insertError.message}`);
  }

  // Update provider verification status to pending_review if currently unverified
  await supabase
    .from("profiles")
    .update({ provider_verification_status: "pending_review" })
    .eq("id", userId)
    .eq("provider_verification_status", "unverified");

  return doc as ProviderDocument;
}

/**
 * Get all documents for a provider.
 */
export async function getProviderDocuments(
  supabase: SupabaseClient,
  userId: string
): Promise<ProviderDocument[]> {
  const { data, error } = await supabase
    .from("provider_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get provider documents: ${error.message}`);
  }

  return (data ?? []) as ProviderDocument[];
}

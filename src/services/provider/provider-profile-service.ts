/**
 * provider-profile-service.ts
 *
 * Profile management for the provider dashboard: fetch, update, and avatar upload.
 * All functions accept a SupabaseClient so they work in server and client contexts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceProviderDetails = Readonly<{
  id: string;
  user_id: string;
  business_name: string | null;
  services: string[] | null;
  description: string | null;
  hourly_rate: number | null;
  avatar_url: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  years_experience: number | null;
  created_at: string;
  updated_at: string;
}>;

export type ProviderProfileUpdates = Partial<
  Pick<
    ServiceProviderDetails,
    | "business_name"
    | "services"
    | "description"
    | "hourly_rate"
    | "phone"
    | "website"
    | "address"
    | "city"
    | "postcode"
    | "years_experience"
  >
>;

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const profileUpdateSchema = z.object({
  business_name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional(),
  services: z.array(z.string()).optional(),
  hourly_rate: z.number().nonnegative().optional(),
  phone: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  years_experience: z.number().int().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// getProviderProfile
// ---------------------------------------------------------------------------

/**
 * Fetches the full service_provider_details row for the given user_id.
 * Returns null if no profile exists yet.
 */
export async function getProviderProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ServiceProviderDetails | null> {
  const { data, error } = await supabase
    .from("service_provider_details")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as ServiceProviderDetails | null) ?? null;
}

// ---------------------------------------------------------------------------
// updateProviderProfile
// ---------------------------------------------------------------------------

/**
 * Updates the service_provider_details row for the given provider id.
 * Validates business_name length (2-100 chars) and description max 2000 chars.
 * Returns the updated row.
 */
export async function updateProviderProfile(
  supabase: SupabaseClient,
  providerId: string,
  updates: ProviderProfileUpdates,
): Promise<ServiceProviderDetails> {
  const validation = profileUpdateSchema.safeParse(updates);
  if (!validation.success) {
    // Zod v4 uses .issues; v3 used .errors — support both
    const issues =
      (validation.error as unknown as { issues?: Array<{ message: string }> }).issues ??
      (validation.error as unknown as { errors?: Array<{ message: string }> }).errors ??
      [];
    throw new Error(issues.map((i) => i.message).join("; ") || "Validation failed");
  }

  const { data, error } = await supabase
    .from("service_provider_details")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", providerId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ServiceProviderDetails;
}

// ---------------------------------------------------------------------------
// uploadAvatar
// ---------------------------------------------------------------------------

/**
 * Uploads a provider avatar to the 'avatars' bucket at path
 * `providers/{userId}/avatar`, updates avatar_url on the profile row,
 * and returns the public URL.
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `providers/${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(storagePath, file, { upsert: true });

  if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // Update avatar_url on the profile
  const { error: updateError } = await supabase
    .from("service_provider_details")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (updateError) throw new Error(`Failed to update avatar URL: ${updateError.message}`);

  return publicUrl;
}

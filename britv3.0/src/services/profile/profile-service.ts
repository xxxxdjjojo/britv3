/**
 * Profile management service -- CRUD operations with Zod validation,
 * avatar upload via Sharp, provider profile management, and notification preferences.
 */

import { z } from "zod";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { sanitizeText } from "@/lib/validation/sanitize";
import { invalidateCachePattern } from "@/lib/cache/redis";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@/types/notifications";
import type { NotificationPreferences, EventType, DigestFrequency } from "@/types/notifications";
import type { Profile } from "@/types/auth";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

/** UK phone regex: +44, 07, or 0 followed by digits/spaces */
const UK_PHONE_REGEX = /^(?:\+44|0)[\d\s]{9,13}$/;

export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters"),
  phone: z
    .string()
    .regex(UK_PHONE_REGEX, "Must be a valid UK phone number")
    .optional()
    .or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

const serviceItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1).max(500),
});

export const providerProfileSchema = z.object({
  services: z.array(serviceItemSchema).min(1, "At least one service required"),
  coverage_postcodes: z.array(z.string().min(2).max(10)).min(1, "At least one postcode required"),
  pricing: z.record(z.string(), z.number().min(0)),
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;

const eventChannelSchema = z.object({
  in_app: z.boolean(),
  email: z.boolean(),
});

const quietHoursSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
});

export const notificationPreferencesSchema = z.object({
  per_type: z.record(z.string(), eventChannelSchema).transform((val) => {
    return val as Partial<Record<EventType, { in_app: boolean; email: boolean }>>;
  }),
  quiet_hours: quietHoursSchema,
  digest_frequency: z.enum(["daily", "weekly", "never"] as const) as z.ZodType<DigestFrequency>,
});

// ---------------------------------------------------------------------------
// Allowed avatar MIME types
// ---------------------------------------------------------------------------

const ALLOWED_AVATAR_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// ---------------------------------------------------------------------------
// Supabase client type (injected for testability)
// ---------------------------------------------------------------------------

type SupabaseClient = {
  from: (table: string) => ReturnType<import("@supabase/supabase-js").SupabaseClient["from"]>;
  storage: {
    from: (bucket: string) => ReturnType<import("@supabase/supabase-js").SupabaseClient["storage"]["from"]>;
  };
};

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Get profile for a user.
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`Failed to get profile: ${error.message}`);
  }

  return data as unknown as Profile;
}

/**
 * Update profile fields with Zod validation and text sanitization.
 * Invalidates dashboard cache after update.
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  input: unknown,
): Promise<Profile> {
  const parsed = profileUpdateSchema.parse(input);

  const sanitized = {
    display_name: sanitizeText(parsed.display_name),
    phone: parsed.phone ? sanitizeText(parsed.phone) : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(sanitized)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  // Invalidate dashboard cache for this user
  await invalidateCachePattern(`dashboard:${userId}:*`);

  return data as unknown as Profile;
}

/**
 * Upload and process avatar image.
 * Validates magic bytes, resizes to 400x400 WebP via Sharp,
 * uploads to Supabase Storage.
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  fileBuffer: ArrayBuffer,
): Promise<string> {
  // Validate file type via magic bytes
  const uint8 = new Uint8Array(fileBuffer);
  const detected = await fileTypeFromBuffer(uint8);

  if (!detected || !ALLOWED_AVATAR_MIMES.has(detected.mime)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
  }

  // Resize to 400x400 WebP using Sharp
  const processed = await sharp(Buffer.from(fileBuffer))
    .resize(400, 400, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toBuffer();

  const storagePath = `${userId}/avatar.webp`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(storagePath, processed, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Update profile with avatar URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    throw new Error(`Failed to update avatar URL: ${updateError.message}`);
  }

  return publicUrl;
}

/**
 * Update service provider extended profile.
 * Validates the user has service_provider role.
 */
export async function updateProviderProfile(
  supabase: SupabaseClient,
  userId: string,
  input: unknown,
): Promise<void> {
  // Check user role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new Error(`Failed to check user role: ${profileError.message}`);
  }

  if ((profile as { active_role: string }).active_role !== "service_provider") {
    throw new Error("Only service providers can update provider profiles");
  }

  const parsed = providerProfileSchema.parse(input);

  const { error } = await supabase
    .from("profiles")
    .update({
      provider_details: {
        services: parsed.services,
        coverage_postcodes: parsed.coverage_postcodes,
        pricing: parsed.pricing,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update provider profile: ${error.message}`);
  }
}

/**
 * Get notification preferences for a user.
 * Returns defaults when no preferences are set.
 */
export async function getNotificationPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to get notification preferences: ${error.message}`);
  }

  const row = data as { preferences: NotificationPreferences | null } | null;

  if (!row?.preferences) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return row.preferences;
}

/**
 * Update notification preferences with Zod validation.
 */
export async function updateNotificationPreferences(
  supabase: SupabaseClient,
  userId: string,
  input: unknown,
): Promise<NotificationPreferences> {
  const parsed = notificationPreferencesSchema.parse(input);

  const prefs: NotificationPreferences = {
    per_type: parsed.per_type,
    quiet_hours: parsed.quiet_hours,
    digest_frequency: parsed.digest_frequency,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      preferences: prefs,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update notification preferences: ${error.message}`);
  }

  return prefs;
}

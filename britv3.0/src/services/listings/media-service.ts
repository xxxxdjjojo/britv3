/**
 * Media service for property listings.
 * Handles image upload, processing, deletion, and reordering.
 * All functions accept a Supabase client as first parameter.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PropertyMedia } from "@/types/property";
import { validateImageFile, validateDocumentFile } from "@/lib/upload/validate";
import { processPropertyImage } from "@/lib/upload/process";

const MAX_IMAGES_PER_LISTING = 30;

// -- Helpers ------------------------------------------------------------------

async function verifyListingOwnership(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", listingId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Listing not found or not owned by user");
  }
}

async function getNextSortOrder(
  supabase: SupabaseClient,
  listingId: string,
): Promise<number> {
  const { data } = await supabase
    .from("property_media")
    .select("sort_order")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  return data ? data.sort_order + 1 : 0;
}

function extractStoragePath(url: string): string {
  // Extract path after the bucket name from a Supabase Storage URL
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (match) return match[1];
  // Fallback: take everything after the last known bucket segment
  const parts = url.split("/");
  const bucketIdx = parts.findIndex(
    (p) => p === "property-images" || p === "property-documents",
  );
  if (bucketIdx >= 0) return parts.slice(bucketIdx + 1).join("/");
  return url;
}

// -- Image upload -------------------------------------------------------------

/**
 * Upload a property image with server-side processing.
 * 1. Verify ownership
 * 2. Check max image count (30)
 * 3. Validate file via magic bytes
 * 4. Process: auto-rotate, strip EXIF, WebP, thumbnail
 * 5. Upload processed + thumbnail to Supabase Storage
 * 6. Create property_media record
 */
export async function uploadPropertyImage(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
  file: Buffer,
  filename: string,
): Promise<PropertyMedia> {
  // 1. Verify ownership
  await verifyListingOwnership(supabase, userId, listingId);

  // 2. Check image count
  const { data: existing, count } = await supabase
    .from("property_media")
    .select("id", { count: "exact" })
    .eq("listing_id", listingId);

  const currentCount = count ?? existing?.length ?? 0;
  if (currentCount >= MAX_IMAGES_PER_LISTING) {
    throw new Error(
      `Maximum of ${MAX_IMAGES_PER_LISTING} images per listing exceeded`,
    );
  }

  // 3. Validate file
  const validation = await validateImageFile(file);
  if (!validation.valid) {
    throw new Error(`Invalid file: ${validation.error}`);
  }

  // 4. Process image
  const { processed, thumbnail } = await processPropertyImage(file);

  // 5. Upload to Supabase Storage
  const uuid = crypto.randomUUID();
  const processedPath = `${listingId}/${uuid}.webp`;
  const thumbnailPath = `${listingId}/${uuid}-thumb.webp`;

  const { error: uploadError } = await supabase.storage
    .from("property-images")
    .upload(processedPath, processed, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { error: thumbError } = await supabase.storage
    .from("property-images")
    .upload(thumbnailPath, thumbnail, {
      contentType: "image/webp",
      upsert: false,
    });

  if (thumbError) {
    throw new Error(`Failed to upload thumbnail: ${thumbError.message}`);
  }

  // Get public URLs
  const { data: urlData } = supabase.storage
    .from("property-images")
    .getPublicUrl(processedPath);

  const { data: thumbUrlData } = supabase.storage
    .from("property-images")
    .getPublicUrl(thumbnailPath);

  // 6. Get sort order and create record
  const sortOrder = await getNextSortOrder(supabase, listingId);

  const { data: media, error: insertError } = await supabase
    .from("property_media")
    .insert({
      listing_id: listingId,
      media_type: "image",
      url: urlData.publicUrl,
      thumbnail_url: thumbUrlData.publicUrl,
      sort_order: sortOrder,
      file_size: processed.length,
      original_filename: filename,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (insertError || !media) {
    throw new Error(
      `Failed to create media record: ${insertError?.message ?? "Unknown error"}`,
    );
  }

  return media as PropertyMedia;
}

// -- Floor plan / document upload ---------------------------------------------

/**
 * Upload a floor plan or document.
 * Similar to image upload but uses property-documents bucket,
 * validates as document, and skips thumbnail generation for PDFs.
 */
export async function uploadFloorPlan(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
  file: Buffer,
  filename: string,
): Promise<PropertyMedia> {
  // 1. Verify ownership
  await verifyListingOwnership(supabase, userId, listingId);

  // 2. Validate file
  const validation = await validateDocumentFile(file);
  if (!validation.valid) {
    throw new Error(`Invalid file: ${validation.error}`);
  }

  // 3. Upload to Supabase Storage
  const uuid = crypto.randomUUID();
  const ext = validation.ext || "pdf";
  const storagePath = `${listingId}/${uuid}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("property-documents")
    .upload(storagePath, file, {
      contentType: validation.mime,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload document: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("property-documents")
    .getPublicUrl(storagePath);

  // 4. Get sort order and create record
  const sortOrder = await getNextSortOrder(supabase, listingId);

  const { data: media, error: insertError } = await supabase
    .from("property_media")
    .insert({
      listing_id: listingId,
      media_type: "floor_plan",
      url: urlData.publicUrl,
      thumbnail_url: null,
      sort_order: sortOrder,
      file_size: file.length,
      original_filename: filename,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (insertError || !media) {
    throw new Error(
      `Failed to create media record: ${insertError?.message ?? "Unknown error"}`,
    );
  }

  return media as PropertyMedia;
}

// -- Delete media -------------------------------------------------------------

/**
 * Delete a property image or document.
 * Verifies ownership via listing -> user_id, removes files from storage,
 * and deletes the property_media record.
 */
export async function deletePropertyImage(
  supabase: SupabaseClient,
  userId: string,
  mediaId: string,
): Promise<void> {
  // Get media record
  const { data: media, error: mediaError } = await supabase
    .from("property_media")
    .select("id, listing_id, url, thumbnail_url")
    .eq("id", mediaId)
    .single();

  if (mediaError || !media) {
    throw new Error("Media not found");
  }

  // Verify ownership via listing
  await verifyListingOwnership(supabase, userId, media.listing_id);

  // Remove files from storage
  const bucket = media.url.includes("property-documents")
    ? "property-documents"
    : "property-images";

  const pathsToRemove = [extractStoragePath(media.url)];
  if (media.thumbnail_url) {
    pathsToRemove.push(extractStoragePath(media.thumbnail_url));
  }

  await supabase.storage.from(bucket).remove(pathsToRemove);

  // Delete database record
  const { error: deleteError } = await supabase
    .from("property_media")
    .delete()
    .eq("id", mediaId);

  if (deleteError) {
    throw new Error(`Failed to delete media record: ${deleteError.message}`);
  }
}

// -- Reorder media ------------------------------------------------------------

/**
 * Reorder media items for a listing.
 * Updates sort_order based on the array index of each media ID.
 */
export async function reorderMedia(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
  mediaIds: string[],
): Promise<void> {
  // Verify ownership
  await verifyListingOwnership(supabase, userId, listingId);

  // Update sort_order for each media ID
  for (let i = 0; i < mediaIds.length; i++) {
    const { error } = await supabase
      .from("property_media")
      .update({ sort_order: i })
      .eq("id", mediaIds[i])
      .match({ listing_id: listingId });

    if (error) {
      throw new Error(
        `Failed to reorder media ${mediaIds[i]}: ${error.message}`,
      );
    }
  }
}

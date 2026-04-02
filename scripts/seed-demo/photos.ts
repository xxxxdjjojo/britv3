/**
 * Seed Demo — Property Photos
 *
 * Creates placeholder property_media rows for each listing.
 * Uses placehold.co URLs — real photos will replace these later.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PROPERTIES } from "./config";
import { seedTable } from "./utils";
import { DEMO_LISTING_IDS } from "./properties";

// ---------------------------------------------------------------------------
// Photo Captions by Index
// ---------------------------------------------------------------------------

const PHOTO_CAPTIONS = [
  "Front exterior",
  "Living room",
  "Kitchen",
  "Master bedroom",
  "Garden / outdoor area",
];

// ---------------------------------------------------------------------------
// Row Builder
// ---------------------------------------------------------------------------

function buildPhotoRows(): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  DEMO_PROPERTIES.forEach((property, propertyIndex) => {
    const listingId = DEMO_LISTING_IDS[property.id];
    // 3-5 photos per property: use bedrooms count to vary, clamp to 3-5
    const photoCount = Math.max(3, Math.min(5, property.bedrooms + 1));
    const propNum = propertyIndex + 1;

    for (let photoIdx = 0; photoIdx < photoCount; photoIdx++) {
      const photoNum = photoIdx + 1;
      // Deterministic UUID: d3 prefix + property index (2 digits) + photo index (2 digits)
      const paddedProp = String(propNum).padStart(4, "0");
      const paddedPhoto = String(photoNum).padStart(4, "0");
      const photoId = `d3000000-${paddedProp}-${paddedPhoto}-8000-000000000000`;

      const encodedText = encodeURIComponent(
        `Property ${propNum} Photo ${photoNum}`,
      );
      const url = `https://placehold.co/800x600/e2e8f0/64748b?text=${encodedText}`;
      const thumbnailUrl = `https://placehold.co/400x300/e2e8f0/64748b?text=${encodedText}`;

      rows.push({
        id: photoId,
        listing_id: listingId,
        media_type: "image",
        url,
        thumbnail_url: thumbnailUrl,
        caption: PHOTO_CAPTIONS[photoIdx] ?? `Photo ${photoNum}`,
        sort_order: photoIdx,
      });
    }
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Main Seed Function
// ---------------------------------------------------------------------------

export type SeedPhotosResult = {
  photosSeeded: number;
};

export async function seedPhotos(
  supabase: SupabaseClient,
): Promise<SeedPhotosResult> {
  console.log("\n--- Seeding Property Photos ---\n");

  const photoRows = buildPhotoRows();
  const result = await seedTable(supabase, "property_media", photoRows);

  const photosSeeded = result.success ? result.count : 0;

  console.log("\n--- Photos Summary ---");
  console.log(`  Photos seeded: ${photosSeeded}`);

  return { photosSeeded };
}

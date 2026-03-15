// Wave 0 stub — implemented in Plan 13-04
// Covers: SELL-17 (photo upload compresses and returns Storage path)
import { describe, it } from "vitest";

describe("Photo Upload", () => {
  it.todo("uploadPhoto compresses image before upload using browser-image-compression");
  it.todo("uploadPhoto uploads to listing-photos bucket at path listings/{userId}/{listingId}/{filename}");
  it.todo("photo order is stored in seller_listings.photos JSONB array as [{url, order, caption}]");
  it.todo("drag-drop reorder updates the order field in the photos JSONB array");
});

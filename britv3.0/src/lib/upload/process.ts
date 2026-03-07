/**
 * Server-side image processing using sharp.
 * Auto-rotates, strips EXIF, converts to WebP, generates thumbnails.
 */

import sharp from "sharp";

type ProcessedImage = {
  processed: Buffer;
  thumbnail: Buffer;
};

/**
 * Process a property image:
 * 1. Auto-rotate based on EXIF orientation
 * 2. Strip all EXIF metadata
 * 3. Resize to fit within 2400x1800
 * 4. Convert to WebP quality 85
 * 5. Generate 400x300 cover-crop thumbnail at WebP quality 75
 */
export async function processPropertyImage(
  buffer: Buffer,
): Promise<ProcessedImage> {
  // Main image: auto-rotate, strip EXIF, resize, WebP
  const processed = await sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(2400, 1800, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  // Thumbnail: 400x300 cover crop, WebP quality 75
  const thumbnail = await sharp(buffer)
    .rotate()
    .resize(400, 300, { fit: "cover" })
    .webp({ quality: 75 })
    .toBuffer();

  return { processed, thumbnail };
}

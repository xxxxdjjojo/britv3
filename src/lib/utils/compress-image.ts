/**
 * Client-side image compression utility.
 * Uses Canvas API to resize and compress images to JPEG.
 * Strips EXIF data by redrawing on canvas.
 */

const DEFAULT_MAX_SIZE_KB = 500;
const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_QUALITY = 0.8;

/**
 * Compress an image file to a target size and max width.
 *
 * @param file - The image File to compress
 * @param maxSizeKB - Target max file size in KB (default 500)
 * @param maxWidth - Max pixel width (default 1200)
 * @returns Compressed image as a Blob (JPEG)
 */
export async function compressImage(
  file: File,
  maxSizeKB: number = DEFAULT_MAX_SIZE_KB,
  maxWidth: number = DEFAULT_MAX_WIDTH,
): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);
  const { width, height } = imageBitmap;

  // Calculate scaled dimensions
  let targetWidth = width;
  let targetHeight = height;

  if (width > maxWidth) {
    const ratio = maxWidth / width;
    targetWidth = maxWidth;
    targetHeight = Math.round(height * ratio);
  }

  // Draw on canvas (strips EXIF)
  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas 2D context");
  }

  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
  imageBitmap.close();

  // Try at default quality first
  let quality = DEFAULT_QUALITY;
  let blob = await canvas.convertToBlob({ type: "image/jpeg", quality });

  // Iteratively reduce quality if still too large
  const maxSizeBytes = maxSizeKB * 1024;

  while (blob.size > maxSizeBytes && quality > 0.1) {
    quality -= 0.1;
    blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  }

  return blob;
}

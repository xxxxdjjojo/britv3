import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

export const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate a file buffer using magic bytes detection.
 * Throws if the file type is not allowed or exceeds max size.
 */
export async function validateFile(
  buffer: Buffer
): Promise<{ mime: string; ext: string }> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `File size ${buffer.length} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`
    );
  }

  const type = await fileTypeFromBuffer(buffer);

  if (!type) {
    throw new Error("Unable to determine file type from magic bytes");
  }

  if (!ALLOWED_TYPES.has(type.mime)) {
    throw new Error(
      `File type "${type.mime}" is not allowed. Allowed types: ${[...ALLOWED_TYPES].join(", ")}`
    );
  }

  return { mime: type.mime, ext: type.ext };
}

const IMAGE_TYPES_NEEDING_SANITIZATION = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Strip all EXIF/XMP/ICC metadata from image buffers before storage.
 * PDFs and non-image types are returned unchanged (PDF sanitisation
 * requires a separate pass, deferred to a future task).
 *
 * @param buffer  Raw file buffer (already validated by validateFile)
 * @param mime    MIME type from validateFile result
 * @returns       Sanitised buffer (new Buffer for images, same reference for others)
 */
export async function sanitizeBuffer(buffer: Buffer, mime: string): Promise<Buffer> {
  if (!IMAGE_TYPES_NEEDING_SANITIZATION.has(mime)) {
    return buffer;
  }

  // sharp strips all metadata by default when no .withMetadata() is called.
  // We pass an empty object to be explicit.
  return sharp(buffer)
    .withMetadata({})
    .toBuffer();
}

import { fileTypeFromBuffer } from "file-type";

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

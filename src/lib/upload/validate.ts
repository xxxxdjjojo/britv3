/**
 * File validation using magic byte detection via file-type.
 * Validates MIME types and file sizes for images and documents.
 */

import { fileTypeFromBuffer } from "file-type";

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const ALLOWED_DOCUMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

type ValidationResult = {
  valid: boolean;
  mime: string;
  ext: string;
  error?: string;
};

/**
 * Validate an image file via magic byte detection.
 * Accepts JPEG, PNG, WebP. Rejects files over 10MB.
 */
export async function validateImageFile(
  buffer: Buffer,
): Promise<ValidationResult> {
  // Check file size first
  if (buffer.length > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      mime: "",
      ext: "",
      error: "File exceeds maximum size of 10MB",
    };
  }

  const type = await fileTypeFromBuffer(buffer);

  if (!type) {
    return {
      valid: false,
      mime: "",
      ext: "",
      error: "Unable to determine file type",
    };
  }

  if (!ALLOWED_IMAGE_TYPES.has(type.mime)) {
    return {
      valid: false,
      mime: type.mime,
      ext: type.ext,
      error: `File type ${type.mime} is not allowed. Accepted: JPEG, PNG, WebP`,
    };
  }

  return {
    valid: true,
    mime: type.mime,
    ext: type.ext,
  };
}

/**
 * Validate a document file via magic byte detection.
 * Accepts JPEG, PNG, WebP, PDF (for floor plans and EPC certificates).
 */
export async function validateDocumentFile(
  buffer: Buffer,
): Promise<ValidationResult> {
  // Check file size
  if (buffer.length > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      mime: "",
      ext: "",
      error: "File exceeds maximum size of 10MB",
    };
  }

  const type = await fileTypeFromBuffer(buffer);

  if (!type) {
    return {
      valid: false,
      mime: "",
      ext: "",
      error: "Unable to determine file type",
    };
  }

  if (!ALLOWED_DOCUMENT_TYPES.has(type.mime)) {
    return {
      valid: false,
      mime: type.mime,
      ext: type.ext,
      error: `File type ${type.mime} is not allowed. Accepted: JPEG, PNG, WebP, PDF`,
    };
  }

  return {
    valid: true,
    mime: type.mime,
    ext: type.ext,
  };
}

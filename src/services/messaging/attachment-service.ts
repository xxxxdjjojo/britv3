/**
 * Attachment service -- file validation (magic bytes) and Supabase Storage upload.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AttachmentType } from "@/types/messaging";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/** MIME types we accept (image/jpeg, image/png, image/webp, application/pdf) */
const ALLOWED_TYPES: Record<string, AttachmentType> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
};

/** Extension map for storage path */
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// Magic byte signatures
const SIGNATURES: Array<{ bytes: number[]; offset: number; mime: string }> = [
  { bytes: [0xFF, 0xD8, 0xFF], offset: 0, mime: "image/jpeg" },
  { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0, mime: "image/png" },
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, mime: "image/webp" }, // RIFF header; WebP also has WEBP at offset 8
  { bytes: [0x25, 0x50, 0x44, 0x46], offset: 0, mime: "application/pdf" }, // %PDF
];

/**
 * Detect MIME type from file magic bytes.
 */
async function detectMimeType(file: File): Promise<string | null> {
  const buffer = await file.slice(0, 16).arrayBuffer();
  const view = new Uint8Array(buffer);

  for (const sig of SIGNATURES) {
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (view[sig.offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      // Extra check for WebP: bytes 8-11 must be "WEBP"
      if (sig.mime === "image/webp") {
        const webpTag = [0x57, 0x45, 0x42, 0x50]; // W E B P
        const webpMatch = webpTag.every((b, i) => view[8 + i] === b);
        if (!webpMatch) continue;
      }
      return sig.mime;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Validate attachment
// ---------------------------------------------------------------------------

export type ValidationResult = Readonly<{
  valid: boolean;
  type: AttachmentType;
  mime: string;
  error?: string;
}>;

/**
 * Validate an attachment file by magic bytes and size.
 */
export async function validateAttachment(
  file: File,
): Promise<ValidationResult> {
  // Size check
  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      type: "image",
      mime: "",
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 2MB.`,
    };
  }

  // Magic bytes check
  const detectedMime = await detectMimeType(file);

  if (!detectedMime || !ALLOWED_TYPES[detectedMime]) {
    return {
      valid: false,
      type: "image",
      mime: detectedMime ?? "",
      error: "Unsupported file type. Allowed: JPEG, PNG, WebP, PDF.",
    };
  }

  return {
    valid: true,
    type: ALLOWED_TYPES[detectedMime],
    mime: detectedMime,
  };
}

// ---------------------------------------------------------------------------
// Upload attachment
// ---------------------------------------------------------------------------

export type UploadResult = Readonly<{
  url: string;
  type: AttachmentType;
  sizeBytes: number;
}>;

/**
 * Validate and upload a file to Supabase Storage.
 */
export async function uploadAttachment(
  supabase: SupabaseClient,
  file: File,
  conversationId: string,
  messageId: string,
): Promise<UploadResult> {
  const validation = await validateAttachment(file);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ext = EXT_MAP[validation.mime] ?? "bin";
  const storagePath = `${conversationId}/${messageId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("message-attachments")
    .upload(storagePath, file, {
      contentType: validation.mime,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("message-attachments")
    .getPublicUrl(storagePath);

  return {
    url: urlData.publicUrl,
    type: validation.type,
    sizeBytes: file.size,
  };
}

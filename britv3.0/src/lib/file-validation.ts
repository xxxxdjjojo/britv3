/**
 * File type validation using magic byte signatures.
 * Validates PDF, JPEG, and PNG files by checking the first bytes
 * of the file content rather than relying on file extensions.
 */

type FileValidationResult = {
  valid: boolean;
  mimeType: string | null;
};

/** Magic byte signatures for allowed file types */
const SIGNATURES: ReadonlyArray<{
  bytes: number[];
  mimeType: string;
}> = [
  { bytes: [0x25, 0x50, 0x44, 0x46], mimeType: "application/pdf" },  // %PDF
  { bytes: [0xff, 0xd8, 0xff], mimeType: "image/jpeg" },              // JPEG
  { bytes: [0x89, 0x50, 0x4e, 0x47], mimeType: "image/png" },         // PNG
];

/**
 * Validates a file's type by reading its magic bytes.
 * Only PDF, JPEG, and PNG are accepted.
 */
export async function validateFileType(
  file: File
): Promise<FileValidationResult> {
  if (file.size === 0) {
    return { valid: false, mimeType: null };
  }

  const slice = file.slice(0, 8);
  const buffer = await slice.arrayBuffer();
  const header = new Uint8Array(buffer);

  for (const sig of SIGNATURES) {
    if (header.length < sig.bytes.length) continue;

    const matches = sig.bytes.every(
      (byte, index) => header[index] === byte
    );

    if (matches) {
      return { valid: true, mimeType: sig.mimeType };
    }
  }

  return { valid: false, mimeType: null };
}

/** Maximum file sizes per storage bucket (in bytes) */
export const MAX_FILE_SIZES = {
  "maintenance-photos": 1_048_576,    // 1MB
  "expense-receipts": 2_097_152,      // 2MB
  "property-documents": 2_097_152,    // 2MB
} as const;

export type StorageBucket = keyof typeof MAX_FILE_SIZES;

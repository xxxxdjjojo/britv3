/**
 * Image compression wrapper around browser-image-compression.
 * Provides sensible defaults for property management use cases.
 */

import imageCompression from "browser-image-compression";

type CompressionOptions = {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
};

/**
 * Compresses an image file with configurable options.
 * Defaults: 500KB max, 1920px max dimension, using web workers.
 */
export async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: options?.maxSizeMB ?? 0.5,
    maxWidthOrHeight: options?.maxWidthOrHeight ?? 1920,
    useWebWorker: true,
  });

  // browser-image-compression returns a Blob; wrap as File
  return new File([compressed], file.name, {
    type: compressed.type,
    lastModified: Date.now(),
  });
}

/**
 * Compresses a receipt image to 500KB max.
 * Skips compression for PDF files (returns them as-is).
 */
export async function compressReceipt(file: File): Promise<File> {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return file;
  }

  return compressImage(file, { maxSizeMB: 0.5 });
}

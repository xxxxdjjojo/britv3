/**
 * Client-side image compression using browser-image-compression.
 * Compresses images before upload to reduce bandwidth and storage costs.
 *
 * "use client" -- this module is only used in browser contexts.
 */

import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2400,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.85,
};

const SKIP_THRESHOLD = 500 * 1024; // 500KB -- skip compression for small files

/**
 * Compress a single image file.
 * Skips compression if the file is already under 500KB.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.size < SKIP_THRESHOLD) {
    return file;
  }

  return imageCompression(file, COMPRESSION_OPTIONS);
}

/**
 * Compress multiple image files in parallel.
 * Reports progress via optional callback.
 */
export async function compressMultiple(
  files: File[],
  onProgress?: (completed: number, total: number) => void,
): Promise<File[]> {
  let completed = 0;

  const promises = files.map(async (file) => {
    const result = await compressImage(file);
    completed++;
    onProgress?.(completed, files.length);
    return result;
  });

  return Promise.all(promises);
}

"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useImageUpload } from "@/hooks/useImageUpload";

type ImageUploaderProps = Readonly<{
  listingId: string;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  mediaType?: "image" | "floor_plan" | "epc_document";
}>;

export function ImageUploader({
  listingId,
  accept = { "image/jpeg": [], "image/png": [], "image/webp": [] },
  maxFiles = 30,
  mediaType = "image",
}: ImageUploaderProps) {
  const {
    uploadingFiles,
    uploadedMedia,
    uploadImages,
    deleteImage,
    reorderImages,
    isUploading,
    isDeleting,
  } = useImageUpload();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = maxFiles - uploadedMedia.length;
      if (remaining <= 0) return;
      const filesToUpload = acceptedFiles.slice(0, remaining);
      uploadImages(filesToUpload, listingId);
    },
    [maxFiles, uploadedMedia.length, uploadImages, listingId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - uploadedMedia.length,
    disabled: isUploading || uploadedMedia.length >= maxFiles,
  });

  const moveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const ids = uploadedMedia.map((m) => m.id);
      [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
      reorderImages(ids, listingId);
    },
    [uploadedMedia, reorderImages, listingId],
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index >= uploadedMedia.length - 1) return;
      const ids = uploadedMedia.map((m) => m.id);
      [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
      reorderImages(ids, listingId);
    },
    [uploadedMedia, reorderImages, listingId],
  );

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragActive
            ? "border-brand-accent bg-brand-accent/5"
            : "border-neutral-200 hover:border-neutral-300"
        } ${uploadedMedia.length >= maxFiles ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <input {...getInputProps()} />
        <Upload className="mb-2 size-8 text-neutral-400" />
        {isDragActive ? (
          <p className="text-sm text-brand-accent">Drop files here...</p>
        ) : (
          <>
            <p className="text-sm text-neutral-600">
              Drag & drop files here, or click to browse
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {uploadedMedia.length} of {maxFiles}{" "}
              {mediaType === "image" ? "photos" : "files"}
            </p>
          </>
        )}
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-md border border-neutral-100 p-2"
            >
              <Loader2 className="size-4 shrink-0 animate-spin text-neutral-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-neutral-600">
                  {file.name}
                </p>
                <Progress value={file.progress} className="mt-1 h-1.5" />
              </div>
              <span className="shrink-0 text-xs capitalize text-neutral-400">
                {file.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Media Grid */}
      {uploadedMedia.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {uploadedMedia.map((media, index) => (
            <div
              key={media.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.thumbnail_url ?? media.url}
                alt={media.original_filename ?? `Photo ${index + 1}`}
                className="size-full object-cover"
              />

              {/* Overlay controls */}
              <div className="absolute inset-0 flex items-start justify-between bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-6 rounded-full bg-white/80 p-0 hover:bg-white"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-6 rounded-full bg-white/80 p-0 hover:bg-white"
                    onClick={() => moveDown(index)}
                    disabled={index === uploadedMedia.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-6 rounded-full bg-white/80 p-0 hover:bg-white"
                  onClick={() => deleteImage(media.id, listingId)}
                  disabled={isDeleting}
                  aria-label="Delete"
                >
                  <X className="size-3" />
                </Button>
              </div>

              {/* Primary badge */}
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-brand-accent px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

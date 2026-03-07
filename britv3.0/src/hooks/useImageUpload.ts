"use client";

/**
 * Hook for managing image upload state (compress, upload, delete, reorder).
 * Uses @tanstack/react-query mutations for each operation.
 */

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { compressMultiple } from "@/lib/upload/compress";

type UploadingFile = {
  id: string;
  name: string;
  progress: number;
  status: "compressing" | "uploading" | "done" | "error";
  error?: string;
};

type UploadedMedia = {
  id: string;
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
  original_filename: string | null;
};

export function useImageUpload() {
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async ({
      files,
      listingId,
    }: {
      files: File[];
      listingId: string;
    }) => {
      const fileEntries = files.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        progress: 0,
        status: "compressing" as const,
      }));
      setUploadingFiles((prev) => [...prev, ...fileEntries]);

      // Compress all files
      const compressed = await compressMultiple(files, (completed, total) => {
        setUploadingFiles((prev) =>
          prev.map((uf) => {
            const idx = fileEntries.findIndex((fe) => fe.id === uf.id);
            if (idx >= 0 && idx < completed) {
              return { ...uf, progress: 50, status: "uploading" as const };
            }
            return uf;
          }),
        );
      });

      // Upload each file
      const results: UploadedMedia[] = [];
      for (let i = 0; i < compressed.length; i++) {
        const file = compressed[i];
        const entry = fileEntries[i];

        try {
          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.id === entry.id
                ? { ...uf, status: "uploading" as const, progress: 50 }
                : uf,
            ),
          );

          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch(`/api/listings/${listingId}/media`, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }

          const media = await response.json();
          results.push(media);

          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.id === entry.id
                ? { ...uf, status: "done" as const, progress: 100 }
                : uf,
            ),
          );
        } catch (err) {
          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.id === entry.id
                ? {
                    ...uf,
                    status: "error" as const,
                    error: err instanceof Error ? err.message : "Upload failed",
                  }
                : uf,
            ),
          );
        }
      }

      return results;
    },
    onSuccess: (newMedia) => {
      setUploadedMedia((prev) => [...prev, ...newMedia]);
      // Clear completed uploads after a delay
      setTimeout(() => {
        setUploadingFiles((prev) =>
          prev.filter((uf) => uf.status !== "done"),
        );
      }, 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({
      mediaId,
      listingId,
    }: {
      mediaId: string;
      listingId: string;
    }) => {
      const response = await fetch(`/api/listings/${listingId}/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_id: mediaId }),
      });
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
    },
    onSuccess: (_, { mediaId }) => {
      setUploadedMedia((prev) => prev.filter((m) => m.id !== mediaId));
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({
      mediaIds,
      listingId,
    }: {
      mediaIds: string[];
      listingId: string;
    }) => {
      const response = await fetch(`/api/listings/${listingId}/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_ids: mediaIds }),
      });
      if (!response.ok) {
        throw new Error(`Reorder failed: ${response.status}`);
      }
    },
  });

  const uploadImages = useCallback(
    (files: File[], listingId: string) => {
      uploadMutation.mutate({ files, listingId });
    },
    [uploadMutation],
  );

  const deleteImage = useCallback(
    (mediaId: string, listingId: string) => {
      deleteMutation.mutate({ mediaId, listingId });
    },
    [deleteMutation],
  );

  const reorderImages = useCallback(
    (mediaIds: string[], listingId: string) => {
      reorderMutation.mutate({ mediaIds, listingId });
      // Optimistic reorder
      setUploadedMedia((prev) => {
        const mapped = new Map(prev.map((m) => [m.id, m]));
        return mediaIds
          .map((id, idx) => {
            const media = mapped.get(id);
            return media ? { ...media, sort_order: idx } : null;
          })
          .filter(Boolean) as UploadedMedia[];
      });
    },
    [reorderMutation],
  );

  const setInitialMedia = useCallback((media: UploadedMedia[]) => {
    setUploadedMedia(media);
  }, []);

  return {
    uploadingFiles,
    uploadedMedia,
    uploadImages,
    deleteImage,
    reorderImages,
    setInitialMedia,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

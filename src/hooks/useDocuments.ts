"use client";

/**
 * Hooks for buyer documents — list, upload, delete.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserDocument, DocumentType } from "@/services/documents/documents-service";

const QUERY_KEY = ["documents"];
const STALE_TIME_MS = 60_000; // 1 minute

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export function useDocuments() {
  return useQuery<UserDocument[]>({
    queryKey: QUERY_KEY,
    staleTime: STALE_TIME_MS,
    queryFn: async () => {
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }
      return response.json();
    },
  });
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export type UploadDocumentVars = {
  file: File;
  documentType: DocumentType;
};

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<UserDocument, Error, UploadDocumentVars>({
    mutationFn: async ({ file, documentType }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw Object.assign(new Error(data.error ?? "Failed to upload document"), {
          code: data.error,
          status: response.status,
        });
      }

      // TODO: posthog.capture("document.uploaded", { documentId: data.id })

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => {
      // TODO: posthog.capture("document.upload_failed")
    },
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { documentId: string }>({
    mutationFn: async ({ documentId }) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete document");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

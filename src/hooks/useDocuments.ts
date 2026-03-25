"use client";

/**
 * Hooks for buyer documents — list, upload, delete.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics/track-event";
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
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const mutation = useMutation<UserDocument, Error, UploadDocumentVars>({
    mutationFn: async ({ file, documentType }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      return new Promise<UserDocument>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(xhr.responseText);
          } catch {
            reject(new Error("Failed to parse upload response"));
            return;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            trackEvent("document.uploaded", { documentId: (data as { id: string }).id });
            resolve(data as unknown as UserDocument);
          } else {
            reject(
              Object.assign(
                new Error((data.error as string) ?? "Failed to upload document"),
                { code: data.error, status: xhr.status },
              ),
            );
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error during upload"));
        };

        xhr.ontimeout = () => {
          reject(new Error("Upload timed out"));
        };

        xhr.onabort = () => {
          reject(new Error("Upload aborted"));
        };

        xhr.open("POST", "/api/documents");
        xhr.timeout = 300_000; // 5 minutes
        xhr.send(formData);
      });
    },
    onSettled: () => {
      setUploadProgress(0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return { ...mutation, uploadProgress };
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

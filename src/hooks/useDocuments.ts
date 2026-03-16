"use client";

/**
 * Client-side hooks for the buyer document vault.
 * Uses @tanstack/react-query for data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserDocument, DocumentType } from "@/services/documents/documents-service";

const QUERY_KEY = ["documents"];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/**
 * Fetch the user's documents list.
 */
export function useDocuments() {
  return useQuery<UserDocument[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 60_000,
  });
}

/**
 * Mutation to upload a document.
 * Performs client-side validation before sending the request.
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      documentType,
      offerId,
    }: {
      file: File;
      documentType: DocumentType;
      offerId?: string;
    }): Promise<UserDocument> => {
      // Client-side validation
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large (max 50MB)");
        throw new Error("File too large (max 50MB)");
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        toast.error("File type not allowed");
        throw new Error("File type not allowed");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);
      if (offerId) {
        formData.append("offer_id", offerId);
      }

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Upload failed (${response.status})`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      // Avoid double-toasting for client-side validation errors already shown
      const isValidationError =
        error.message === "File too large (max 50MB)" ||
        error.message === "File type not allowed";
      if (!isValidationError) {
        toast.error(error.message || "Failed to upload document");
      }
    },
  });
}

/**
 * Mutation to delete a document by id.
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string): Promise<void> => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Delete failed (${response.status})`);
      }
    },
    onSuccess: () => {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete document");
    },
  });
}

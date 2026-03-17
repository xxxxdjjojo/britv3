/**
 * Buyer documents service — upload, list, and delete user documents.
 * Stores files in Supabase Storage bucket "buyer-documents" at path
 * [userId]/[uuid].[ext], then records metadata in user_documents table.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceError } from "@/types/service-error";

export type { ServiceError };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentStatus = "uploaded" | "pending_review" | "verified" | "rejected";

export type DocumentType = "id_proof" | "proof_of_funds" | "aip_letter" | "other";

export type UserDocument = Readonly<{
  id: string;
  user_id: string;
  offer_id: string | null;
  document_type: DocumentType;
  storage_path: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
}>;

export type UploadDocumentResult = Readonly<{ document: UserDocument }> | ServiceError;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUCKET = "buyer-documents";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isServiceError(val: unknown): val is ServiceError {
  return typeof val === "object" && val !== null && "error" in val;
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  };
  return map[mimeType] ?? "bin";
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Fetch all documents belonging to a user.
 */
export async function getDocuments(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserDocument[] | ServiceError> {
  try {
    const { data, error } = await supabase
      .from("user_documents")
      .select(
        "id, user_id, offer_id, document_type, storage_path, file_name, file_size_bytes, mime_type, status, created_at, updated_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[documents-service] getDocuments failed", { error });
      return { error: error.message };
    }

    return (data ?? []) as UserDocument[];
  } catch (err) {
    console.error("[documents-service] getDocuments threw", { err });
    return { error: "Failed to fetch documents" };
  }
}

/**
 * Generate a short-lived signed download URL for a document.
 */
export async function getSignedDownloadUrl(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
): Promise<string> {
  const { data: doc, error: fetchError } = await supabase
    .from("user_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError || !doc) {
    throw new Error("Document not found");
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl((doc as { storage_path: string }).storage_path, 300);

  if (error || !data?.signedUrl) {
    throw new Error("Failed to generate download URL");
  }

  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Upload a document to storage and insert a record in user_documents.
 * Validates file size and MIME type before uploading.
 */
export async function uploadDocument(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  documentType: DocumentType,
): Promise<UploadDocumentResult> {
  try {
    // Client-side validations (also enforced at API layer)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { error: "FILE_TOO_LARGE" };
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { error: "INVALID_MIME_TYPE" };
    }

    const ext = getExtension(file.type);
    const fileId = crypto.randomUUID();
    const storagePath = `${userId}/${fileId}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[documents-service] uploadDocument storage upload failed", { uploadError });
      return { error: uploadError.message };
    }

    // Insert metadata record
    const { data, error: insertError } = await supabase
      .from("user_documents")
      .insert({
        user_id: userId,
        document_type: documentType,
        storage_path: storagePath,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        status: "uploaded",
      })
      .select(
        "id, user_id, offer_id, document_type, storage_path, file_name, file_size_bytes, mime_type, status, created_at, updated_at",
      )
      .single();

    if (insertError) {
      console.error("[documents-service] uploadDocument insert failed", { insertError });
      // Attempt to clean up the orphaned storage file
      const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([storagePath]);
      if (cleanupError) {
        console.error("[documents-service] Failed to clean up orphaned storage file", { storagePath, cleanupError });
      }
      return { error: insertError.message };
    }

    return { document: data as UserDocument };
  } catch (err) {
    console.error("[documents-service] uploadDocument threw", { err });
    return { error: "Failed to upload document" };
  }
}

/**
 * Delete a document from storage and the database record.
 */
export async function deleteDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
): Promise<null | ServiceError> {
  try {
    // Fetch the record first to get the storage path
    const { data: doc, error: fetchError } = await supabase
      .from("user_documents")
      .select("storage_path")
      .eq("id", documentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("[documents-service] deleteDocument fetch failed", { fetchError });
      return { error: fetchError.message };
    }

    if (!doc) {
      return { error: "NOT_FOUND" };
    }

    const { storage_path } = doc as { storage_path: string };

    // Delete database record first
    const { error: deleteError } = await supabase
      .from("user_documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("[documents-service] deleteDocument db delete failed", { deleteError });
      return { error: deleteError.message };
    }

    // Delete from storage (best-effort — record is already gone)
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([storage_path]);

    if (storageError) {
      console.error("[documents-service] deleteDocument storage delete failed (non-fatal)", {
        storageError,
      });
      // Non-fatal: DB record is deleted, storage cleanup can be done by a cron
    }

    return null;
  } catch (err) {
    console.error("[documents-service] deleteDocument threw", { err });
    return { error: "Failed to delete document" };
  }
}

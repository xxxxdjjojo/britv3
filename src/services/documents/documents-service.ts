/**
 * Buyer documents service.
 * Handles upload, retrieval, and deletion of user_documents records
 * backed by the buyer-documents Supabase Storage bucket.
 *
 * Storage path convention: {userId}/{documentId}/{fileName}
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentType = "id_proof" | "proof_of_funds" | "aip_letter" | "other";
export type DocumentStatus = "uploaded" | "pending_review" | "verified" | "rejected";

export type UserDocument = {
  id: string;
  offer_id: string | null;
  document_type: DocumentType;
  storage_path: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Return all documents for the given user, ordered newest-first.
 */
export async function getDocuments(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserDocument[]> {
  const { data, error } = await supabase
    .from("user_documents")
    .select(
      "id, offer_id, document_type, storage_path, file_name, file_size_bytes, mime_type, status, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return (data ?? []) as UserDocument[];
}

/**
 * Upload a file to Supabase Storage and create the user_documents row.
 * Throws if the storage upload fails.
 */
export async function uploadDocument(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  documentType: DocumentType,
  offerId?: string,
): Promise<UserDocument> {
  const documentId = crypto.randomUUID();
  const storagePath = `${userId}/${documentId}/${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("buyer-documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data, error: insertError } = await supabase
    .from("user_documents")
    .insert({
      id: documentId,
      user_id: userId,
      offer_id: offerId ?? null,
      document_type: documentType,
      storage_path: storagePath,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      status: "uploaded",
    })
    .select(
      "id, offer_id, document_type, storage_path, file_name, file_size_bytes, mime_type, status, created_at, updated_at",
    )
    .single();

  if (insertError) {
    // Best-effort cleanup of the orphaned storage object
    await supabase.storage.from("buyer-documents").remove([storagePath]);
    throw new Error(`Failed to save document record: ${insertError.message}`);
  }

  return data as UserDocument;
}

/**
 * Delete a document: verifies ownership, removes storage object, then deletes the row.
 */
export async function deleteDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
): Promise<void> {
  // Fetch with ownership check
  const { data, error: fetchError } = await supabase
    .from("user_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !data) {
    throw new Error("Document not found or access denied");
  }

  const { storage_path } = data as { storage_path: string };

  // Remove from storage (ignore storage errors — row delete is authoritative)
  await supabase.storage.from("buyer-documents").remove([storage_path]);

  const { error: deleteError } = await supabase
    .from("user_documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error(`Failed to delete document: ${deleteError.message}`);
  }
}

/**
 * Generate a short-lived signed download URL for a document.
 * expiresIn is in seconds; defaults to 1 hour.
 */
export async function getSignedDownloadUrl(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
  expiresIn = 3600,
): Promise<string> {
  // Verify ownership
  const { data, error: fetchError } = await supabase
    .from("user_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !data) {
    throw new Error("Document not found or access denied");
  }

  const { storage_path } = data as { storage_path: string };

  const { data: urlData, error: signError } = await supabase.storage
    .from("buyer-documents")
    .createSignedUrl(storage_path, expiresIn);

  if (signError || !urlData) {
    throw new Error(`Failed to generate download URL: ${signError?.message ?? "unknown error"}`);
  }

  return urlData.signedUrl;
}

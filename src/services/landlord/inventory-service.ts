/**
 * Inventory service -- create and manage check-in/check-out inventory reports
 * with photo uploads to the landlord-documents storage bucket.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { InventoryReport } from "@/types/landlord";

// -- Service functions -------------------------------------------------------

/**
 * Create a new inventory report for a property.
 */
export async function createInventoryReport(
  supabase: SupabaseClient,
  data: Omit<InventoryReport, "id" | "created_at">,
): Promise<InventoryReport> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data: record, error } = await supabase
    .from("inventory_reports")
    .insert({
      ...data,
      landlord_id: user.id,
    })
    .select()
    .single();

  if (error || !record) {
    throw new Error(
      `Failed to create inventory report: ${error?.message ?? "no data"}`,
    );
  }

  return record as InventoryReport;
}

/**
 * Get all inventory reports for a property.
 */
export async function getInventoryReports(
  supabase: SupabaseClient,
  propertyId: string,
): Promise<InventoryReport[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("inventory_reports")
    .select("*")
    .eq("property_id", propertyId)
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch inventory reports: ${error.message}`);
  }

  return (data ?? []) as InventoryReport[];
}

/**
 * Update an existing inventory report (e.g., add rooms, update status, mark complete).
 */
export async function updateInventoryReport(
  supabase: SupabaseClient,
  reportId: string,
  updates: Partial<InventoryReport>,
): Promise<InventoryReport> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("inventory_reports")
    .update(updates)
    .eq("id", reportId)
    .eq("landlord_id", user.id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update inventory report: ${error?.message ?? "no data"}`,
    );
  }

  return data as InventoryReport;
}

/**
 * Upload a photo to the inventory report's folder in Supabase Storage.
 * Uploads to landlord-documents/{userId}/inventory/{reportId}/
 * Returns a signed URL for the uploaded photo.
 */
export async function uploadInventoryPhoto(
  supabase: SupabaseClient,
  reportId: string,
  file: File,
): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const filePath = `${user.id}/inventory/${reportId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("landlord-documents")
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    throw new Error(`Failed to upload photo: ${uploadError.message}`);
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from("landlord-documents")
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

  if (signedError || !signedData?.signedUrl) {
    throw new Error("Failed to create signed URL for uploaded photo");
  }

  return signedData.signedUrl;
}

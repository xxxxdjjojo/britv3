/**
 * Tenancy service -- CRUD operations for property tenancies.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tenancy, TenancyFormData } from "@/types/landlord";
import { tenancySchema } from "@/types/landlord";

/**
 * List tenancies for a property, optionally filtered by status.
 */
export async function getTenancies(
  supabase: SupabaseClient,
  propertyId: string,
  status?: string,
): Promise<Tenancy[]> {
  let query = supabase
    .from("tenancies")
    .select("*")
    .eq("property_id", propertyId)
    .order("lease_start_date", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch tenancies: ${error.message}`);
  }

  return (data ?? []) as Tenancy[];
}

/**
 * Fetch a single tenancy by ID.
 */
export async function getTenancy(
  supabase: SupabaseClient,
  tenancyId: string,
): Promise<Tenancy> {
  const { data, error } = await supabase
    .from("tenancies")
    .select("*")
    .eq("id", tenancyId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Tenancy not found");
  }

  return data as Tenancy;
}

/**
 * Create a new tenancy for a property.
 * Validates input with tenancySchema and sets landlord_id from auth.
 */
export async function createTenancy(
  supabase: SupabaseClient,
  propertyId: string,
  data: TenancyFormData,
): Promise<Tenancy> {
  const parsed = tenancySchema.parse(data);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const insertData = {
    property_id: propertyId,
    landlord_id: user.id,
    tenant_name: parsed.tenant_name,
    tenant_email: parsed.tenant_email || null,
    tenant_phone: parsed.tenant_phone || null,
    status: "active" as const,
    lease_start_date: parsed.lease_start_date,
    lease_end_date: parsed.lease_end_date || null,
    rent_amount: parsed.rent_amount,
    rent_frequency: parsed.rent_frequency,
    deposit_amount: parsed.deposit_amount ?? null,
    deposit_scheme: parsed.deposit_scheme || null,
    notes: parsed.notes || null,
  };

  const { data: tenancy, error } = await supabase
    .from("tenancies")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create tenancy: ${error.message}`);
  }

  return tenancy as Tenancy;
}

/**
 * Update an existing tenancy (partial update).
 * Handles status change to 'ended' by setting appropriate fields.
 */
export async function updateTenancy(
  supabase: SupabaseClient,
  tenancyId: string,
  data: Partial<TenancyFormData> & { status?: string },
): Promise<Tenancy> {
  // Build update object, only including provided fields
  const updateData: Record<string, unknown> = {};

  if (data.tenant_name !== undefined) updateData.tenant_name = data.tenant_name;
  if (data.tenant_email !== undefined) updateData.tenant_email = data.tenant_email || null;
  if (data.tenant_phone !== undefined) updateData.tenant_phone = data.tenant_phone || null;
  if (data.lease_start_date !== undefined) updateData.lease_start_date = data.lease_start_date;
  if (data.lease_end_date !== undefined) updateData.lease_end_date = data.lease_end_date || null;
  if (data.rent_amount !== undefined) updateData.rent_amount = data.rent_amount;
  if (data.rent_frequency !== undefined) updateData.rent_frequency = data.rent_frequency;
  if (data.deposit_amount !== undefined) updateData.deposit_amount = data.deposit_amount ?? null;
  if (data.deposit_scheme !== undefined) updateData.deposit_scheme = data.deposit_scheme || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  // Handle status change to 'ended'
  if (data.status === "ended") {
    updateData.status = "ended";
    // Set lease_end_date to today if not already set
    if (!updateData.lease_end_date) {
      updateData.lease_end_date = new Date().toISOString().split("T")[0];
    }
  } else if (data.status !== undefined) {
    updateData.status = data.status;
  }

  updateData.updated_at = new Date().toISOString();

  const { data: tenancy, error } = await supabase
    .from("tenancies")
    .update(updateData)
    .eq("id", tenancyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update tenancy: ${error.message}`);
  }

  return tenancy as Tenancy;
}

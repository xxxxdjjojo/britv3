/**
 * Deposit service -- manage tenancy deposit registrations (TDS, DPS, mydeposits).
 * GDPR-compliant: all data scoped to authenticated landlord's tenancies.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DepositRegistration } from "@/types/landlord";

// -- Service functions -------------------------------------------------------

/**
 * Create a new deposit registration record.
 */
export async function createDepositRegistration(
  supabase: SupabaseClient,
  data: Omit<DepositRegistration, "id" | "created_at" | "updated_at">,
): Promise<DepositRegistration> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data: record, error } = await supabase
    .from("deposit_registrations")
    .insert({
      ...data,
      landlord_id: user.id,
    })
    .select()
    .single();

  if (error || !record) {
    throw new Error(
      `Failed to create deposit registration: ${error?.message ?? "no data"}`,
    );
  }

  return record as DepositRegistration;
}

/**
 * Get the deposit registration for a specific tenancy.
 * Returns null if no deposit has been registered yet.
 */
export async function getDepositByTenancy(
  supabase: SupabaseClient,
  tenancyId: string,
): Promise<DepositRegistration | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("deposit_registrations")
    .select("*")
    .eq("tenancy_id", tenancyId)
    .eq("landlord_id", user.id)
    .single();

  if (error) {
    // PGRST116 = "Searched for one row, found no rows" — return null
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch deposit: ${error.message}`);
  }

  return (data ?? null) as DepositRegistration | null;
}

/**
 * Update an existing deposit registration (e.g., update scheme reference, status).
 */
export async function updateDeposit(
  supabase: SupabaseClient,
  depositId: string,
  updates: Partial<DepositRegistration>,
): Promise<DepositRegistration> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("deposit_registrations")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", depositId)
    .eq("landlord_id", user.id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update deposit: ${error?.message ?? "no data"}`,
    );
  }

  return data as DepositRegistration;
}

/**
 * List all deposit registrations for the authenticated landlord.
 */
export async function listDeposits(
  supabase: SupabaseClient,
): Promise<DepositRegistration[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("deposit_registrations")
    .select("*")
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch deposits: ${error.message}`);
  }

  return (data ?? []) as DepositRegistration[];
}

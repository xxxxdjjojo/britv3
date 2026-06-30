/**
 * Deposit service -- manage tenancy deposit registrations (TDS, DPS, mydeposits).
 * GDPR-compliant: all data scoped to authenticated landlord's tenancies.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DepositRegistration } from "@/types/landlord";

// -- Service functions -------------------------------------------------------

type DepositRegistrationInput =
  Omit<DepositRegistration, "id" | "created_at" | "updated_at" | "landlord_id"> & {
    landlord_id?: string;
  };

async function getAuthenticatedUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  return user.id;
}

async function requireOwnedTenancy(
  supabase: SupabaseClient,
  userId: string,
  tenancyId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("tenancies")
    .select("id")
    .eq("id", tenancyId)
    .eq("landlord_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Tenancy not found");
  }
}

async function getOwnedTenancyIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("tenancies")
    .select("id")
    .eq("landlord_id", userId);

  if (error) {
    throw new Error(`Failed to fetch tenancies: ${error.message}`);
  }

  return (data ?? []).map((tenancy) => tenancy.id as string);
}

function withoutOwnershipFields(
  updates: Partial<DepositRegistrationInput>,
): Partial<DepositRegistrationInput> {
  const { landlord_id: _landlordId, tenancy_id: _tenancyId, ...safeUpdates } = updates;
  return safeUpdates;
}

/**
 * Create a new deposit registration record.
 */
export async function createDepositRegistration(
  supabase: SupabaseClient,
  data: DepositRegistrationInput,
): Promise<DepositRegistration> {
  const userId = await getAuthenticatedUserId(supabase);
  await requireOwnedTenancy(supabase, userId, data.tenancy_id);

  const { landlord_id: _landlordId, ...insertData } = data;

  const { data: record, error } = await supabase
    .from("deposit_registrations")
    .insert(insertData)
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
  const userId = await getAuthenticatedUserId(supabase);
  await requireOwnedTenancy(supabase, userId, tenancyId);

  const { data, error } = await supabase
    .from("deposit_registrations")
    .select("*")
    .eq("tenancy_id", tenancyId)
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
  const userId = await getAuthenticatedUserId(supabase);
  const tenancyIds = await getOwnedTenancyIds(supabase, userId);

  if (tenancyIds.length === 0) {
    throw new Error("No tenancies found");
  }

  const { data, error } = await supabase
    .from("deposit_registrations")
    .update({
      ...withoutOwnershipFields(updates as Partial<DepositRegistrationInput>),
      updated_at: new Date().toISOString(),
    })
    .eq("id", depositId)
    .in("tenancy_id", tenancyIds)
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
 * Deposit-protection compliance counts for the authenticated landlord, derived
 * from active tenancies vs their deposit registrations. Drives the compliance
 * dashboard's deposit tile.
 *
 * - protected:   active tenancies with a 'registered' deposit
 * - pending:     active tenancies whose deposit registration is still 'pending'
 * - unprotected: active tenancies that take a deposit but have no registration
 *   (a compliance breach — protection is legally required within 30 days)
 */
export async function getDepositComplianceCounts(
  supabase: SupabaseClient,
): Promise<{ totalTenancies: number; protected: number; pending: number; unprotected: number }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data: tenancies, error: tErr } = await supabase
    .from("tenancies")
    .select("id, deposit_amount")
    .eq("landlord_id", user.id)
    .eq("status", "active");

  if (tErr) throw new Error(`Failed to fetch tenancies: ${tErr.message}`);

  const activeTenancies = tenancies ?? [];
  const tenancyIds = activeTenancies.map((t) => t.id as string);

  const { data: deposits, error: dErr } = tenancyIds.length > 0
    ? await supabase
        .from("deposit_registrations")
        .select("tenancy_id, status")
        .in("tenancy_id", tenancyIds)
    : { data: [], error: null };

  if (dErr) throw new Error(`Failed to fetch deposits: ${dErr.message}`);

  const statusByTenancy = new Map<string, string>();
  for (const d of deposits ?? []) {
    statusByTenancy.set(d.tenancy_id as string, d.status as string);
  }

  let protectedCount = 0;
  let pending = 0;
  let unprotected = 0;
  for (const t of activeTenancies) {
    const takesDeposit = Number(t.deposit_amount ?? 0) > 0;
    const status = statusByTenancy.get(t.id as string);
    if (status === "registered") {
      protectedCount += 1;
    } else if (status === "pending") {
      pending += 1;
    } else if (takesDeposit) {
      // Active tenancy that takes a deposit but has no registration at all.
      unprotected += 1;
    }
  }

  return {
    totalTenancies: activeTenancies.length,
    protected: protectedCount,
    pending,
    unprotected,
  };
}

/**
 * List all deposit registrations for the authenticated landlord.
 */
export async function listDeposits(
  supabase: SupabaseClient,
): Promise<DepositRegistration[]> {
  const userId = await getAuthenticatedUserId(supabase);
  const tenancyIds = await getOwnedTenancyIds(supabase, userId);

  if (tenancyIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("deposit_registrations")
    .select("*")
    .in("tenancy_id", tenancyIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch deposits: ${error.message}`);
  }

  return (data ?? []) as DepositRegistration[];
}

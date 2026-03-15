import { createClient } from "@/lib/supabase/server";
import type { UserRole, VerificationLevel, VerificationStage } from "@/types/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

type RoleServiceResult<T = null> = {
  data: T;
  error: { message: string } | null;
};

/**
 * Single source of truth for assigning a single role to a user.
 * Upserts into user_roles (prevents duplicate rows) and sets active_role on profile.
 * Throws on failure — callers are responsible for error handling.
 *
 * @param client - Optional Supabase client. When omitted the server client is used
 *                 (server context only). Pass a browser client when calling from a
 *                 client component.
 */
export async function assignRole(
  userId: string,
  role: UserRole,
  client?: SupabaseClient,
): Promise<void> {
  if (!userId) throw new Error("assignRole: userId is required");

  // Use provided client (browser context) or fall back to server client
  const supabase: SupabaseClient = client ?? (await createClient());

  // TODO: wrap in RPC for atomicity
  const { error: upsertError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

  if (upsertError) {
    throw new Error(`Failed to assign role: ${upsertError.message}`);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ active_role: role })
    .eq("id", userId);

  if (updateError) {
    throw new Error(`Failed to update active_role: ${updateError.message}`);
  }
}

/**
 * Select roles for a user during registration.
 * Upserts into user_roles (idempotent — prevents duplicate rows from retry) and sets active_role on profile.
 */
export async function selectRoles(
  userId: string,
  roles: UserRole[],
): Promise<RoleServiceResult> {
  const uniqueRoles = [...new Set(roles)];

  if (uniqueRoles.length === 0) {
    return { data: null, error: { message: "At least one role must be selected" } };
  }

  const supabase = await createClient();

  const { error: upsertError } = await supabase
    .from("user_roles")
    .upsert(
      uniqueRoles.map((role) => ({ user_id: userId, role })),
      { onConflict: "user_id,role" },
    );

  if (upsertError) {
    return { data: null, error: { message: upsertError.message } };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ active_role: uniqueRoles[0] })
    .eq("id", userId);

  if (updateError) {
    return { data: null, error: { message: updateError.message } };
  }

  return { data: null, error: null };
}

/**
 * Switch the user's active role. Only works if user has the role.
 */
export async function switchRole(
  userId: string,
  role: UserRole,
): Promise<RoleServiceResult> {
  const supabase = await createClient();

  const { data: roleRecord } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle();

  if (!roleRecord) {
    return { data: null, error: { message: "User does not have the requested role" } };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ active_role: role })
    .eq("id", userId);

  if (updateError) {
    return { data: null, error: { message: updateError.message } };
  }

  return { data: null, error: null };
}

/**
 * Get all roles for a user.
 */
export async function getUserRoles(
  userId: string,
): Promise<RoleServiceResult<{ id: string; user_id: string; role: UserRole; granted_at: string }[] | null>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

/**
 * Get the user's current active role from their profile.
 */
export async function getActiveRole(
  userId: string,
): Promise<RoleServiceResult<UserRole | null>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", userId)
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data: data?.active_role ?? null, error: null };
}

/**
 * Compute verification level based on completed verification stages.
 * Pure function -- no database access.
 */
export function computeVerificationLevel(
  completedStages: VerificationStage[],
): VerificationLevel {
  const stages = new Set(completedStages);

  const hasEmail = stages.has("email");
  const hasPhone = stages.has("phone");
  const hasIdentity = stages.has("identity");
  const hasInsurance = stages.has("insurance");
  const hasQualifications = stages.has("qualifications");
  const hasAdminReview = stages.has("admin_review");

  if (hasEmail && hasPhone && hasIdentity && hasInsurance && hasQualifications && hasAdminReview) {
    return "professional";
  }

  if (hasEmail && hasPhone && hasIdentity) {
    return "enhanced";
  }

  if (hasEmail && hasPhone) {
    return "standard";
  }

  return "basic";
}

import { createClient } from "@/lib/supabase/server";
import type { UserRole, VerificationLevel, VerificationStage } from "@/types/auth";

type RoleServiceResult<T = null> = {
  data: T;
  error: { message: string } | null;
};

/**
 * Single source of truth for assigning a single role to a user (server-only).
 * Calls assign_role_atomic RPC which upserts into user_roles, sets active_role,
 * and writes an audit log entry — all in one transaction.
 * Throws on failure — callers are responsible for error handling.
 */
export async function assignRole(
  userId: string,
  role: UserRole,
): Promise<void> {
  if (!userId) throw new Error("assignRole: userId is required");

  const supabase = await createClient();

  const { error } = await supabase.rpc("assign_role_atomic", {
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    throw new Error(`Failed to assign role: ${error.message}`);
  }
}

/**
 * Select roles for a user during registration.
 * Calls select_roles_atomic RPC which upserts all roles, sets active_role to
 * the first role, and writes an audit log entry — all in one transaction.
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

  const { error } = await supabase.rpc("select_roles_atomic", {
    p_user_id: userId,
    p_roles: uniqueRoles,
  });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data: null, error: null };
}

/**
 * Switch the user's active role. Only works if user has the role.
 * Calls switch_role_atomic RPC which verifies role ownership, updates active_role,
 * and writes an audit log entry with old and new role — all in one transaction.
 */
export async function switchRole(
  userId: string,
  role: UserRole,
): Promise<RoleServiceResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("switch_role_atomic", {
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    // RPC raises an exception when user doesn't have the role — surface it cleanly
    return { data: null, error: { message: error.message } };
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

/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AdminRole, AdminPermission } from "@/lib/admin-permissions";
import { ADMIN_ROLES, hasPermission } from "@/lib/admin-permissions";

type ProfileWithRole = { is_admin: boolean | null; admin_role: string | null };

function isAdminRole(value: string | null | undefined): value is AdminRole {
  return !!value && ADMIN_ROLES.includes(value as AdminRole);
}

export type AdminContext = {
  user: User;
  supabase: SupabaseClient;
};

export async function adminOnly(
  _request: Request,
): Promise<AdminContext | Response> {
  void _request;
  let supabase: SupabaseClient;

  try {
    supabase = await createClient();
  } catch (e) {
    console.error("[admin-guard] Failed to create Supabase client:", e);
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let profile: ProfileWithRole | null = null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin, admin_role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[admin-guard] Failed to fetch profile:", error);
      return Response.json({ error: "Service unavailable" }, { status: 503 });
    }

    profile = data as ProfileWithRole | null;
  } catch (e) {
    console.error("[admin-guard] DB error fetching profile:", e);
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (profile?.is_admin !== true) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminRole(profile.admin_role)) {
    return Response.json({ error: "Admin role not configured" }, { status: 403 });
  }

  return { user, supabase };
}

export type AdminContextWithRole = {
  user: User;
  supabase: SupabaseClient;
  adminRole: AdminRole;
};

export async function adminWithPermission(
  request: Request,
  permission: AdminPermission,
): Promise<AdminContextWithRole | Response> {
  let supabase: SupabaseClient;

  try {
    supabase = await createClient();
  } catch (e) {
    console.error("[admin-guard] Failed to create Supabase client:", e);
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let profile: ProfileWithRole | null = null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin, admin_role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[admin-guard] Failed to fetch profile:", error);
      return Response.json({ error: "Service unavailable" }, { status: 503 });
    }

    profile = data as ProfileWithRole | null;
  } catch (e) {
    console.error("[admin-guard] DB error fetching profile:", e);
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (profile?.is_admin !== true) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Deny access if admin_role is not explicitly set — never default to super_admin.
  // The migration backfills existing admins, so null means unmigrated or a bug.
  if (!isAdminRole(profile.admin_role)) {
    return Response.json({ error: "Admin role not configured" }, { status: 403 });
  }
  const adminRole = profile.admin_role;

  if (!hasPermission(adminRole, permission)) {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  return { user, supabase, adminRole };
}

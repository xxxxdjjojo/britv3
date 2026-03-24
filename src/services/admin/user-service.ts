import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizePostgrestInput } from "@/lib/validation/sanitize";
import type { AdminRole } from "@/lib/admin-permissions";

export type UserSearchResult = {
  id: string;
  display_name: string | null;
  email: string | null;
  active_role: string | null;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string | null;
};

export type UserDetail = {
  id: string;
  display_name: string | null;
  email: string | null;
  active_role: string | null;
  is_admin: boolean;
  is_suspended: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  verification_level: string | null;
  created_at: string | null;
};

/**
 * Consolidates the DB update → Auth update → rollback-on-failure pattern
 * used by suspendUser, banUser, and activateUser.
 */
async function withAuthSync(
  supabase: SupabaseClient,
  userId: string,
  profileUpdate: Record<string, unknown>,
  rollbackUpdate: Record<string, unknown>,
  banDuration: string,
): Promise<{ success: boolean }> {
  // 1. Update DB first
  const { error: dbError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId);

  if (dbError) return { success: false };

  // 2. Sync Auth ban/unban using service role client
  const adminClient = createAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    userId,
    { ban_duration: banDuration },
  );

  if (authError) {
    // Rollback DB change if Auth update fails
    const { error: rollbackError } = await supabase
      .from("profiles")
      .update(rollbackUpdate)
      .eq("id", userId);

    if (rollbackError) {
      console.error("[admin:auth-sync] ALERT: rollback failed after auth error", {
        userId,
        profileUpdate,
        rollbackError,
        authError,
      });
    }

    return { success: false };
  }

  return { success: true };
}

export async function searchUsers(
  supabase: SupabaseClient,
  query: string,
  page: number,
  limit: number,
): Promise<{ users: UserSearchResult[]; total: number }> {
  const from = page * limit;
  const to = from + limit - 1;

  // Sanitize query to prevent Supabase PostgREST filter injection
  const sanitized = sanitizePostgrestInput(query).slice(0, 100);

  let queryBuilder = supabase
    .from("profiles")
    .select("id, display_name, active_role, is_admin, suspended_until, banned_at, created_at", {
      count: "exact",
    });

  // Only apply filter if there's a search query
  if (sanitized.length > 0) {
    queryBuilder = queryBuilder.ilike("display_name", `%${sanitized}%`);
  }

  const { data, count, error } = await queryBuilder
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin:searchUsers] Query failed:", error.message);
    return { users: [], total: 0 };
  }

  // Map DB columns to expected shape
  const users: UserSearchResult[] = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    display_name: row.display_name as string | null,
    email: null, // email lives in auth.users, not profiles
    active_role: row.active_role as string | null,
    is_admin: row.is_admin === true,
    is_suspended: row.suspended_until != null || row.banned_at != null,
    created_at: row.created_at as string | null,
  }));

  return { users, total: count ?? 0 };
}

export type SuspendDuration = "24h" | "7d" | "30d" | "indefinite";

const DURATION_MS: Record<SuspendDuration, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "indefinite": 100 * 365 * 24 * 60 * 60 * 1000,
};

const DURATION_HOURS: Record<SuspendDuration, string> = {
  "24h": "24h",
  "7d": "168h",
  "30d": "720h",
  "indefinite": "876600h",
};

export async function suspendUser(
  supabase: SupabaseClient,
  userId: string,
  duration: SuspendDuration = "indefinite",
): Promise<{ success: boolean }> {
  return withAuthSync(
    supabase,
    userId,
    { suspended_until: new Date(Date.now() + DURATION_MS[duration]).toISOString() },
    { suspended_until: null },
    DURATION_HOURS[duration],
  );
}

export async function banUser(
  supabase: SupabaseClient,
  userId: string,
  reason: string,
): Promise<{ success: boolean }> {
  return withAuthSync(
    supabase,
    userId,
    { ban_reason: reason, banned_at: new Date().toISOString(), suspended_until: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() },
    { ban_reason: null, banned_at: null, suspended_until: null },
    "876600h",
  );
}

export async function activateUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ success: boolean }> {
  return withAuthSync(
    supabase,
    userId,
    { suspended_until: null, ban_reason: null, banned_at: null },
    { suspended_until: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() },
    "none",
  );
}

export async function promoteToAdmin(
  supabase: SupabaseClient,
  userId: string,
  adminRole: AdminRole = "moderation_admin",
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: true, admin_role: adminRole })
    .eq("id", userId);
  return { success: !error };
}

export async function demoteFromAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: false, admin_role: null })
    .eq("id", userId);
  return { success: !error };
}

export async function getUserDetail(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserDetail | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, active_role, is_admin, suspended_until, ban_reason, banned_at, verification_level, created_at",
    )
    .eq("id", userId)
    .single();

  if (error) return null;

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    display_name: row.display_name as string | null,
    email: null,
    active_role: row.active_role as string | null,
    is_admin: row.is_admin === true,
    is_suspended: row.suspended_until != null || row.banned_at != null,
    ban_reason: row.ban_reason as string | null,
    banned_at: row.banned_at as string | null,
    verification_level: row.verification_level as string | null,
    created_at: row.created_at as string | null,
  };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizePostgrestInput } from "@/lib/validation/sanitize";

export type UserSearchResult = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_suspended: boolean | null;
  created_at: string | null;
};

export type UserDetail = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_suspended: boolean | null;
  ban_reason: string | null;
  banned_at: string | null;
  verification_status: string | null;
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

  const { data, count, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_suspended, created_at", {
      count: "exact",
    })
    .or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) return { users: [], total: 0 };

  return {
    users: (data as UserSearchResult[]) ?? [],
    total: count ?? 0,
  };
}

export async function suspendUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ success: boolean }> {
  return withAuthSync(
    supabase,
    userId,
    { is_suspended: true },
    { is_suspended: false },
    "876600h",
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
    { is_suspended: true, ban_reason: reason, banned_at: new Date().toISOString() },
    { is_suspended: false, ban_reason: null, banned_at: null },
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
    { is_suspended: false, ban_reason: null, banned_at: null },
    { is_suspended: true },
    "none",
  );
}

export async function promoteToAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);
  return { success: !error };
}

export async function demoteFromAdmin(
  supabase: SupabaseClient,
  userId: string,
  newRole: string = "homebuyer",
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
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
      "id, full_name, email, role, is_suspended, ban_reason, banned_at, verification_status, created_at",
    )
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as UserDetail;
}

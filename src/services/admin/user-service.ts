import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function searchUsers(
  supabase: SupabaseClient,
  query: string,
  page: number,
  limit: number,
): Promise<{ users: UserSearchResult[]; total: number }> {
  const from = page * limit;
  const to = from + limit - 1;

  // Sanitize query to prevent Supabase PostgREST filter injection
  // Strip %, _, and \ which have special meaning in ILIKE patterns
  const sanitized = query.replace(/[%_\\]/g, "").slice(0, 100);

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
  // 1. Update DB first
  const { error: dbError } = await supabase
    .from("profiles")
    .update({ is_suspended: true })
    .eq("id", userId);

  if (dbError) return { success: false };

  // 2. Block Auth login using service role client — ~100 years = permanent
  const adminClient = createAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    userId,
    { ban_duration: "876600h" },
  );

  if (authError) {
    // Rollback DB change if Auth ban fails
    await supabase
      .from("profiles")
      .update({ is_suspended: false })
      .eq("id", userId);
    return { success: false };
  }

  return { success: true };
}

export async function banUser(
  supabase: SupabaseClient,
  userId: string,
  reason: string,
): Promise<{ success: boolean }> {
  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      is_suspended: true,
      ban_reason: reason,
      banned_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (dbError) return { success: false };

  const adminClient = createAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    userId,
    { ban_duration: "876600h" },
  );

  if (authError) {
    await supabase
      .from("profiles")
      .update({
        is_suspended: false,
        ban_reason: null,
        banned_at: null,
      })
      .eq("id", userId);
    return { success: false };
  }

  return { success: true };
}

export async function activateUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ success: boolean }> {
  // 1. Update DB first
  const { error: dbError } = await supabase
    .from("profiles")
    .update({ is_suspended: false })
    .eq("id", userId);

  if (dbError) return { success: false };

  // 2. Unban in Auth using service role client
  const adminClient = createAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    userId,
    { ban_duration: "none" },
  );

  if (authError) {
    // Rollback DB change if Auth unban fails
    await supabase
      .from("profiles")
      .update({ is_suspended: true })
      .eq("id", userId);
    return { success: false };
  }

  return { success: true };
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

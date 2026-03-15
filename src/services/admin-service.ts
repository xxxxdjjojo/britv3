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

export type VerificationQueueItem = {
  id: string;
  full_name: string | null;
  email: string | null;
  verification_status: string | null;
  provider_details: Record<string, unknown> | null;
  created_at: string | null;
};

export type ReportedReview = {
  id: string;
  entity_id: string | null;
  reason: string | null;
  status: string | null;
  created_at: string | null;
  review?: Record<string, unknown> | null;
};

export type AdminCounts = {
  totalUsers: number;
  activeListings: number;
  pendingVerifications: number;
  openReports: number;
  totalReviews: number;
};

async function safeCount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: PromiseLike<{ count: number | null; error: any }>,
): Promise<number> {
  try {
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getAdminCounts(
  supabase: SupabaseClient,
): Promise<AdminCounts> {
  const [
    totalUsers,
    activeListings,
    pendingVerifications,
    openReports,
    totalReviews,
  ] = await Promise.all([
    safeCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true }),
    ),
    safeCount(
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ),
    safeCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "pending"),
    ),
    safeCount(
      supabase
        .from("content_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ),
    safeCount(
      supabase
        .from("provider_reviews")
        .select("id", { count: "exact", head: true }),
    ),
  ]);

  return {
    totalUsers,
    activeListings,
    pendingVerifications,
    openReports,
    totalReviews,
  };
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

export async function getVerificationQueue(
  supabase: SupabaseClient,
): Promise<VerificationQueueItem[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, verification_status, provider_details, created_at",
    )
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data as VerificationQueueItem[]) ?? [];
}

export async function reviewVerification(
  supabase: SupabaseClient,
  userId: string,
  decision: "approved" | "rejected",
  notes?: string,
): Promise<{ success: boolean }> {
  const update: Record<string, unknown> = {
    verification_status: decision,
  };
  if (notes !== undefined) {
    update.verification_notes = notes;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId);

  return { success: !error };
}

export async function getReportedReviews(
  supabase: SupabaseClient,
): Promise<ReportedReview[]> {
  const { data, error } = await supabase
    .from("content_reports")
    .select("id, entity_id, reason, status, created_at")
    .eq("entity_type", "review")
    .eq("status", "open")
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data as ReportedReview[]) ?? [];
}

export async function resolveReport(
  supabase: SupabaseClient,
  reportId: string,
  resolution: "resolved" | "dismissed",
  note: string | undefined,
  adminId: string,
): Promise<{ success: boolean }> {
  const update: Record<string, unknown> = {
    status: resolution,
    resolved_by: adminId,
    resolved_at: new Date().toISOString(),
  };
  if (note !== undefined) {
    update.resolution_note = note;
  }

  const { error } = await supabase
    .from("content_reports")
    .update(update)
    .eq("id", reportId);

  return { success: !error };
}

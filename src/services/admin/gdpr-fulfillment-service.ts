import { createAdminClient } from "@/lib/supabase/admin";

export type GdprExportData = {
  profile: Record<string, unknown> | null;
  properties: Record<string, unknown>[];
  messages_sent: number;
  reviews_written: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
  gdpr_requests: Record<string, unknown>[];
  content_reports_filed: Record<string, unknown>[];
  exported_at: string;
};

export async function aggregateUserData(userId: string): Promise<GdprExportData> {
  const admin = createAdminClient();

  const [
    { data: profile },
    { data: properties },
    { count: messagesCount },
    { data: reviews },
    { data: subscriptions },
    { data: gdprRequests },
    { data: reports },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).single(),
    admin.from("properties").select("id, title, status, created_at").eq("owner_id", userId),
    admin.from("messages").select("id", { count: "exact", head: true }).eq("sender_id", userId),
    admin.from("reviews").select("id, rating, content, created_at").eq("reviewer_id", userId),
    admin.from("subscriptions").select("id, plan, status, created_at").eq("user_id", userId),
    admin.from("gdpr_requests").select("id, request_type, status, created_at").eq("user_id", userId),
    admin.from("content_reports").select("id, entity_type, reason, created_at").eq("reporter_id", userId),
  ]);

  const safeProfile = profile ? { ...profile } : null;
  if (safeProfile) {
    delete safeProfile.password_hash;
    delete safeProfile.two_factor_secret;
    delete safeProfile.oauth_tokens;
  }

  return {
    profile: safeProfile,
    properties: properties ?? [],
    messages_sent: messagesCount ?? 0,
    reviews_written: reviews ?? [],
    subscriptions: subscriptions ?? [],
    gdpr_requests: gdprRequests ?? [],
    content_reports_filed: reports ?? [],
    exported_at: new Date().toISOString(),
  };
}

export async function deleteUserData(
  userId: string,
): Promise<{ deleted: boolean; details: string[] }> {
  const admin = createAdminClient();
  const details: string[] = [];

  const { count: reviewsDeleted } = await admin
    .from("reviews")
    .delete({ count: "exact" })
    .eq("reviewer_id", userId);
  details.push(`Deleted ${reviewsDeleted ?? 0} reviews`);

  const { count: reportsDeleted } = await admin
    .from("content_reports")
    .delete({ count: "exact" })
    .eq("reporter_id", userId);
  details.push(`Deleted ${reportsDeleted ?? 0} content reports`);

  const { count: propertiesRemoved } = await admin
    .from("properties")
    .update({ status: "deleted", owner_id: null })
    .eq("owner_id", userId);
  details.push(`Removed ${propertiesRemoved ?? 0} properties`);

  await admin
    .from("profiles")
    .update({
      display_name: "[Deleted User]",
      full_name: null,
      email: null,
      phone: null,
      avatar_url: null,
      bio: null,
      address_line_1: null,
      address_line_2: null,
      city: null,
      postcode: null,
      date_of_birth: null,
      is_admin: false,
      admin_role: null,
    })
    .eq("id", userId);
  details.push("Anonymized profile");

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    details.push(`Auth deletion failed: ${authError.message}`);
    return { deleted: false, details };
  }
  details.push("Deleted auth user and all sessions");

  return { deleted: true, details };
}

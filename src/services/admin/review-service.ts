import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportedReview = {
  id: string;
  entity_id: string | null;
  reason: string | null;
  status: string | null;
  created_at: string | null;
  review?: Record<string, unknown> | null;
};

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

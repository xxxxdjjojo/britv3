import type { SupabaseClient } from "@supabase/supabase-js";
import { sendFlagOutcome } from "@/services/email/email-service";

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

  if (error) {
    console.error("[admin:review-service] getReportedReviews failed", { error: error.message });
    return [];
  }
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

  const { data: report } = await supabase
    .from("content_reports")
    .select("reporter_id, entity_id")
    .eq("id", reportId)
    .single();

  const { error } = await supabase
    .from("content_reports")
    .update(update)
    .eq("id", reportId);

  // Fire-and-forget: notify the reporter of the outcome
  if (!error && report?.reporter_id) {
    const { data: reporter } = await supabase
      .from("user_profiles")
      .select("first_name, email")
      .eq("user_id", report.reporter_id as string)
      .single();

    // Fetch review title for the email
    let reviewTitle = "the reported review";
    if (report.entity_id) {
      const { data: review } = await supabase
        .from("reviews")
        .select("title")
        .eq("id", report.entity_id as string)
        .single();
      if (review?.title) {
        reviewTitle = review.title as string;
      }
    }

    if (reporter?.email) {
      const outcome = resolution === "resolved" ? "removed" : "kept";
      void sendFlagOutcome({
        userId: report.reporter_id as string,
        email: reporter.email as string,
        recipientFirstName: (reporter.first_name as string) ?? "there",
        outcome,
        reviewTitle,
      });
    }
  }

  return { success: !error };
}

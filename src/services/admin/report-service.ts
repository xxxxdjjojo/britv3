import type { SupabaseClient } from "@supabase/supabase-js";

export type ContentReport = {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  reason: string | null;
  status: string | null;
  created_at: string | null;
  reporter_id: string | null;
};

export async function getOpenReports(
  supabase: SupabaseClient,
): Promise<ContentReport[]> {
  const { data, error } = await supabase
    .from("content_reports")
    .select("id, entity_type, entity_id, reason, status, created_at, reporter_id")
    .eq("status", "open")
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data as ContentReport[]) ?? [];
}

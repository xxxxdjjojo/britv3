import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditLogEntry = {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

export type AuditLogFilters = {
  action?: string;
  adminId?: string;
  cursor?: string; // ISO timestamp — load entries before this
  limit?: number;
};

export async function getAuditLog(
  supabase: SupabaseClient,
  filters: AuditLogFilters = {},
): Promise<AuditLogEntry[]> {
  const limit = filters.limit ?? 50;

  let query = supabase
    .from("admin_audit_log")
    .select(
      "id, admin_id, action, target_type, target_id, metadata, ip_address, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.cursor) {
    query = query.lt("created_at", filters.cursor); // cursor-based: WHERE created_at < cursor
  }
  if (filters.action) {
    query = query.eq("action", filters.action);
  }
  if (filters.adminId) {
    query = query.eq("admin_id", filters.adminId);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data as AuditLogEntry[]) ?? [];
}

// Re-export logAdminAction from lib for convenience
export { logAdminAction } from "@/lib/admin-audit";

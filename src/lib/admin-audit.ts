import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminActionLog = {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
};

export async function logAdminAction(
  supabase: SupabaseClient,
  log: AdminActionLog,
): Promise<void> {
  // Best-effort — never throw, just log errors
  try {
    await supabase.from("admin_audit_log").insert({
      admin_id: log.adminId,
      action: log.action,
      target_type: log.targetType,
      target_id: log.targetId,
      metadata: log.metadata ?? null,
    });
  } catch (e) {
    console.error("[audit] Failed to log admin action:", e);
  }
}

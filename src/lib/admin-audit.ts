import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminActionLog = {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  success?: boolean;
  errorMessage?: string;
};

export async function logAdminAction(
  supabase: SupabaseClient,
  log: AdminActionLog,
): Promise<void> {
  // Best-effort — never throw, just log errors
  try {
    await supabase.rpc("log_admin_action", {
      p_admin_id: log.adminId,
      p_action: log.action,
      p_target_type: log.targetType,
      p_target_id: log.targetId,
      p_metadata: log.metadata ?? null,
      p_ip_address: log.ipAddress ?? null,
      p_success: log.success ?? null,
      p_error_message: log.errorMessage ?? null,
    });
  } catch (e) {
    // Fallback: direct insert (for environments where RPC isn't deployed yet)
    try {
      await supabase.from("admin_audit_log").insert({
        admin_id: log.adminId,
        action: log.action,
        target_type: log.targetType,
        target_id: log.targetId,
        metadata: log.metadata ?? null,
        ip_address: log.ipAddress ?? null,
        success: log.success ?? null,
        error_message: log.errorMessage ?? null,
      });
    } catch (fallbackError) {
      console.error("[audit] Failed to log admin action:", fallbackError);
    }
  }
}

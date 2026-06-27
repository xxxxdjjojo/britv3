import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { sanitizePostgrestInput } from "@/lib/validation/sanitize-text";

export async function POST(req: Request) {
  return auditedAdminActionWithPermission(
    req,
    "audit_log.export",
    "audit_log",
    "csv_export",
    "view_audit_log",
    async ({ supabase }) => {
      const url = new URL(req.url);
      const rawAction = url.searchParams.get("action") ?? undefined;
      const adminId = url.searchParams.get("adminId") ?? undefined;

      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (adminId && !UUID_RE.test(adminId)) {
        throw new Error("Invalid adminId format");
      }

      const action = rawAction ? sanitizePostgrestInput(rawAction) : undefined;

      let query = supabase
        .from("admin_audit_log")
        .select("id, admin_id, action, target_type, target_id, ip_address, success, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(10000);

      if (action) query = query.ilike("action", `%${action}%`);
      if (adminId) query = query.eq("admin_id", adminId);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      // Sanitize CSV cell values to prevent formula injection in Excel
      function csvSafe(val: unknown): string {
        const s = String(val ?? "").replace(/"/g, '""');
        // Prefix formula-triggering characters with a single quote
        if (/^[=+\-@\t\r]/.test(s)) return `"'${s}"`;
        return `"${s}"`;
      }

      const headers = ["id", "admin_id", "action", "target_type", "target_id", "ip_address", "success", "error_message", "created_at"];
      const rows = (data ?? []).map((e: Record<string, unknown>) =>
        headers.map((h) => csvSafe(e[h]))
      );
      const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

      return { csv, count: data?.length ?? 0 };
    },
  );
}

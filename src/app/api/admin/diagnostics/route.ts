import { adminWithPermission } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDeepHealthStatus } from "@/services/admin/health-service";
import { getDiagnostics } from "@/services/admin/diagnostics-service";

/**
 * Privileged deep diagnostics (PR 4) — gated on `view_system_health`. Returns
 * DB-derived diagnostics (DLQ backlog, probe staleness, email failures, GDPR
 * age) plus a dependency sweep. Public `/api/health` is untouched. Even for
 * admins, internal `error` strings are stripped from the service statuses.
 */
export async function GET(req: Request): Promise<Response> {
  const ctx = await adminWithPermission(req, "view_system_health");
  if (ctx instanceof Response) return ctx;

  const [diagnostics, services] = await Promise.all([
    getDiagnostics(createAdminClient()),
    getDeepHealthStatus(),
  ]);

  const safeServices = services.map((s) => ({
    name: s.name,
    status: s.status,
    latencyMs: s.latencyMs,
  }));

  return Response.json({ diagnostics, services: safeServices });
}

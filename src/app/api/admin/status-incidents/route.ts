import { adminWithPermission } from "@/lib/admin-guard";
import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import {
  type CreateIncidentInput,
  createIncident,
  listAllIncidents,
} from "@/services/admin/status-incident-service";

/**
 * Admin status-incident management (PR 3). GET lists every incident (draft +
 * published) for the queue; POST creates one. Both require the
 * `manage_status_page` permission (super_admin / dev_admin). Mutations are
 * audited via admin_audit_log; the read is permission-checked but not audited
 * (listing is not a state change).
 */

export async function GET(req: Request): Promise<Response> {
  const ctx = await adminWithPermission(req, "manage_status_page");
  if (ctx instanceof Response) return ctx;
  const incidents = await listAllIncidents(ctx.supabase);
  return Response.json({ incidents });
}

export async function POST(req: Request): Promise<Response> {
  let body: CreateIncidentInput;
  try {
    body = (await req.json()) as CreateIncidentInput;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(
    req,
    "status_incident.create",
    "status_incident",
    "new",
    "manage_status_page",
    async ({ supabase, user }) => createIncident(supabase, body, user.id),
  );
}

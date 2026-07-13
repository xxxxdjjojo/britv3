import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import {
  type UpdateIncidentPatch,
  updateIncident,
} from "@/services/admin/status-incident-service";

/**
 * Update a single status incident (PR 3): status transition (validated),
 * publish toggle, component change, and/or a public update-timeline entry.
 * Audited via admin_audit_log; requires `manage_status_page`.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  let body: UpdateIncidentPatch;
  try {
    body = (await req.json()) as UpdateIncidentPatch;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(
    req,
    "status_incident.update",
    "status_incident",
    id,
    "manage_status_page",
    async ({ supabase, user }) => {
      await updateIncident(supabase, id, body, user.id);
      return { ok: true };
    },
  );
}

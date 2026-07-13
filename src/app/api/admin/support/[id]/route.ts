import { adminWithPermission } from "@/lib/admin-guard";
import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { sendTicketReplyNotification } from "@/services/email/email-service";
import {
  type TicketAdminPatch,
  applyTicketUpdate,
  getTicketDetail,
} from "@/services/admin/support-admin-service";

/** Ticket detail (GET) + triage actions (PATCH). Gated on manage_support_tickets. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const ctx = await adminWithPermission(req, "manage_support_tickets");
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const ticket = await getTicketDetail(ctx.supabase, id);
  if (!ticket) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ticket });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  let body: TicketAdminPatch;
  try {
    body = (await req.json()) as TicketAdminPatch;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(
    req,
    "support_ticket.update",
    "support_ticket",
    id,
    "manage_support_tickets",
    async ({ supabase, user }) => {
      const outcome = await applyTicketUpdate(supabase, id, body, user.id);
      if (outcome.notifyCustomer) {
        await sendTicketReplyNotification(outcome.notifyCustomer);
      }
      return { ok: true };
    },
  );
}

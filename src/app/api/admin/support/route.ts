import { adminWithPermission } from "@/lib/admin-guard";
import type { TicketStatus } from "@/services/support/ticket-service";
import { listAllTickets } from "@/services/admin/support-admin-service";

/** Admin support queue list (PR 7). Gated on manage_support_tickets. */
export async function GET(req: Request): Promise<Response> {
  const ctx = await adminWithPermission(req, "manage_support_tickets");
  if (ctx instanceof Response) return ctx;

  const status = new URL(req.url).searchParams.get("status") as TicketStatus | null;
  const tickets = await listAllTickets(ctx.supabase, status ?? undefined);
  return Response.json({ tickets });
}

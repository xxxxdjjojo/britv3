import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { generateTriagePacket } from "@/services/support/triage-packet-service";

/**
 * Generate a redacted, LLM-safe triage packet for a ticket (PR 9). Generation
 * is audited (`support_ticket.triage_packet`) because it reads the account's
 * operational state; the response body carries only redacted markdown.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  return auditedAdminActionWithPermission(
    req,
    "support_ticket.triage_packet",
    "support_ticket",
    id,
    "manage_support_tickets",
    async ({ supabase }) => {
      const packet = await generateTriagePacket(supabase, id);
      return { markdown: packet.markdown };
    },
  );
}

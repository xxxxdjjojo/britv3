import type { SupabaseClient } from "@supabase/supabase-js";

import type { TicketStatus } from "@/services/support/ticket-service";

/**
 * Admin support triage (PR 7). Pure status logic is unit-tested; data access
 * uses the service-role client (through the audited admin routes). The customer
 * boundary (RLS) is on the customer side — admin routes see everything.
 */

/** A public admin reply moves an open ticket to "awaiting the customer". */
export function statusAfterAdminReply(current: TicketStatus, internal: boolean): TicketStatus {
  if (internal) return current;
  if (current === "resolved" || current === "closed") return current;
  return "pending_customer";
}

export type AdminTicketSummary = Readonly<{
  id: string;
  reference: string;
  email: string;
  subject: string;
  status: TicketStatus;
  priority: string;
  category: string;
  assignedAdminId: string | null;
  firstResponseAt: string | null;
  createdAt: string;
}>;

export type AdminTicketMessage = Readonly<{
  id: string;
  authorType: "customer" | "admin" | "system";
  body: string;
  internalNote: boolean;
  createdAt: string;
}>;

export type AdminTicketDetail = AdminTicketSummary &
  Readonly<{ name: string | null; messages: readonly AdminTicketMessage[] }>;

const SUMMARY_COLS =
  "id, reference, email, subject, status, priority, category, assigned_admin_id, first_response_at, created_at";

function mapSummary(r: Record<string, unknown>): AdminTicketSummary {
  return {
    id: r.id as string,
    reference: r.reference as string,
    email: r.email as string,
    subject: r.subject as string,
    status: r.status as TicketStatus,
    priority: r.priority as string,
    category: r.category as string,
    assignedAdminId: (r.assigned_admin_id as string) ?? null,
    firstResponseAt: (r.first_response_at as string) ?? null,
    createdAt: r.created_at as string,
  };
}

export async function listAllTickets(
  supabase: SupabaseClient,
  statusFilter?: TicketStatus,
): Promise<AdminTicketSummary[]> {
  let query = supabase
    .from("support_tickets")
    .select(SUMMARY_COLS)
    .order("created_at", { ascending: false })
    .limit(200);
  if (statusFilter) query = query.eq("status", statusFilter);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapSummary(r as Record<string, unknown>));
}

export async function getTicketDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<AdminTicketDetail | null> {
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select(`${SUMMARY_COLS}, name`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!ticket) return null;

  const { data: messages, error: msgError } = await supabase
    .from("support_ticket_messages")
    .select("id, author_type, body, internal_note, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });
  if (msgError) throw new Error(msgError.message);

  return {
    ...mapSummary(ticket as Record<string, unknown>),
    name: ((ticket as Record<string, unknown>).name as string) ?? null,
    messages: (messages ?? []).map((m) => {
      const row = m as Record<string, unknown>;
      return {
        id: row.id as string,
        authorType: row.author_type as AdminTicketMessage["authorType"],
        body: row.body as string,
        internalNote: row.internal_note as boolean,
        createdAt: row.created_at as string,
      };
    }),
  };
}

export type TicketAdminPatch = Readonly<{
  status?: TicketStatus;
  assignedAdminId?: string;
  reply?: { body: string; internal: boolean };
}>;

/** Returns a notification instruction when a public reply was posted (route emails it). */
export type TicketUpdateOutcome = Readonly<{
  notifyCustomer: { to: string; reference: string } | null;
}>;

export async function applyTicketUpdate(
  supabase: SupabaseClient,
  id: string,
  patch: TicketAdminPatch,
  adminId: string,
): Promise<TicketUpdateOutcome> {
  const { data: current, error: readError } = await supabase
    .from("support_tickets")
    .select("status, first_response_at, email, reference")
    .eq("id", id)
    .maybeSingle();
  if (readError || !current) throw new Error(readError?.message ?? "Ticket not found");

  const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  let notifyCustomer: TicketUpdateOutcome["notifyCustomer"] = null;

  if (patch.reply?.body?.trim()) {
    const internal = patch.reply.internal;
    const { error: msgError } = await supabase.from("support_ticket_messages").insert({
      ticket_id: id,
      author_type: "admin",
      author_id: adminId,
      body: patch.reply.body.trim(),
      internal_note: internal,
    });
    if (msgError) throw new Error(msgError.message);

    if (!internal) {
      if (!current.first_response_at) fields.first_response_at = new Date().toISOString();
      fields.status = statusAfterAdminReply(current.status as TicketStatus, false);
      notifyCustomer = { to: current.email as string, reference: current.reference as string };
    }
  }

  if (patch.status) {
    fields.status = patch.status;
    if (patch.status === "resolved") fields.resolved_at = new Date().toISOString();
  }
  if (patch.assignedAdminId) fields.assigned_admin_id = patch.assignedAdminId;

  const { error: updateError } = await supabase
    .from("support_tickets")
    .update(fields)
    .eq("id", id);
  if (updateError) throw new Error(updateError.message);

  return { notifyCustomer };
}

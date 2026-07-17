import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Support ticket domain (PR 6). Reference generation + status classification
 * are pure and unit-tested; data access uses the service-role client for
 * creation (public contact route, guests allowed) and an RLS-scoped client for
 * customer reads.
 */

export type TicketCategory =
  | "account"
  | "payments"
  | "listings"
  | "verification"
  | "gdpr"
  | "technical"
  | "other";

export type TicketStatus =
  | "open"
  | "pending_customer"
  | "pending_internal"
  | "resolved"
  | "closed";

const REPLYABLE_STATUSES: readonly TicketStatus[] = ["open", "pending_customer", "pending_internal"];

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

/** Human-readable ticket reference, e.g. `TD-7F3K9Q`. rng injectable for tests. */
export function generateTicketReference(rng: () => number = Math.random): string {
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += REFERENCE_ALPHABET[Math.floor(rng() * REFERENCE_ALPHABET.length)];
  }
  return `TD-${suffix}`;
}

/** Can the customer still add a reply to a ticket in this status? */
export function canCustomerReply(status: TicketStatus): boolean {
  return REPLYABLE_STATUSES.includes(status);
}

export type CreateTicketInput = Readonly<{
  email: string;
  name?: string | null;
  subject: string;
  body: string;
  category?: TicketCategory;
  userId?: string | null;
  correlationId?: string | null;
  source?: string;
}>;

export type CreatedTicket = Readonly<{ id: string; reference: string }>;

/**
 * Persist a ticket + its first (customer) message using the service-role
 * client. Throws on failure — callers that must never lose the intake (the
 * contact route) wrap this and fall back to email-only.
 */
export async function createTicket(input: CreateTicketInput): Promise<CreatedTicket> {
  const supabase = createAdminClient();
  const reference = generateTicketReference();

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      reference,
      user_id: input.userId ?? null,
      email: input.email,
      name: input.name ?? null,
      subject: input.subject,
      category: input.category ?? "other",
      correlation_id: input.correlationId ?? null,
      source: input.source ?? "contact_form",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const ticketId = data.id as string;
  const { error: messageError } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticketId,
    author_type: "customer",
    author_id: input.userId ?? null,
    body: input.body,
  });
  if (messageError) throw new Error(messageError.message);

  return { id: ticketId, reference };
}

export type TicketSummary = Readonly<{
  id: string;
  reference: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}>;

/** The current user's tickets (RLS-scoped client). */
export async function listTicketsForUser(supabase: SupabaseClient): Promise<TicketSummary[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, reference, subject, category, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    const row = r as Record<string, string>;
    return {
      id: row.id,
      reference: row.reference,
      subject: row.subject,
      category: row.category as TicketCategory,
      status: row.status as TicketStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

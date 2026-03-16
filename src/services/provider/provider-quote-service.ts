/**
 * provider-quote-service.ts
 *
 * Quote creation, management, and sending for the provider dashboard.
 * All monetary values are in pence (integer). All functions accept a
 * SupabaseClient so they work in both server and client contexts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuoteLineItem = Readonly<{
  name: string;
  description?: string;
  quantity: number;
  unit_price_pence: number;
  total_pence: number;
}>;

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export type Quote = Readonly<{
  id: string;
  provider_id: string;
  request_id: string | null;
  quote_number: string;
  line_items: QuoteLineItem[];
  subtotal: number;
  total_amount: number;
  status: QuoteStatus;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}>;

export type QuoteWithRequest = Quote &
  Readonly<{
    service_request: Readonly<{
      id: string;
      title: string;
      category: string;
      status: string;
    }> | null;
  }>;

export type CreateQuoteInput = Readonly<{
  request_id?: string;
  line_items: QuoteLineItem[];
  notes?: string;
  valid_until_days?: number;
}>;

export type UpdateQuoteInput = Partial<
  Pick<CreateQuoteInput, "line_items" | "notes" | "valid_until_days">
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate that each line item has a name, qty >= 1 and unit_price >= 0.
 * Throws a descriptive error on the first violation.
 */
function validateLineItems(lineItems: QuoteLineItem[]): void {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new Error("line_items must be a non-empty array");
  }

  lineItems.forEach((item, idx) => {
    if (!item.name || item.name.trim() === "") {
      throw new Error(`line_items[${idx}].name is required`);
    }
    if (item.quantity < 1) {
      throw new Error(`line_items[${idx}].quantity must be >= 1`);
    }
    if (item.unit_price_pence < 0) {
      throw new Error(`line_items[${idx}].unit_price_pence must be >= 0`);
    }
  });
}

/** Compute subtotal (sum of total_pence across all line items). */
function computeSubtotal(lineItems: QuoteLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.total_pence, 0);
}

/** Generate a valid_until ISO date string from today + N days. */
function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Auto-generate the next quote number for this provider.
 * Format: QT-{YYYY}-{NNNN} (4-digit zero-padded sequential number per provider).
 */
async function generateQuoteNumber(
  supabase: SupabaseClient,
  providerId: string,
): Promise<string> {
  const year = new Date().getFullYear();

  const { count, error } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", providerId);

  if (error) {
    throw new Error(`Failed to generate quote number: ${error.message}`);
  }

  const seq = ((count ?? 0) + 1).toString().padStart(4, "0");
  return `QT-${year}-${seq}`;
}

// ---------------------------------------------------------------------------
// createQuote
// ---------------------------------------------------------------------------

/**
 * Creates a new quote in draft status for the provider.
 * Validates line_items and computes subtotal/total.
 * Auto-generates quote number QT-{YYYY}-{NNNN}.
 */
export async function createQuote(
  supabase: SupabaseClient,
  providerId: string,
  input: CreateQuoteInput,
): Promise<Quote> {
  validateLineItems(input.line_items);

  const subtotal = computeSubtotal(input.line_items);
  const quoteNumber = await generateQuoteNumber(supabase, providerId);
  const validUntil =
    input.valid_until_days != null ? addDays(input.valid_until_days) : null;

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      provider_id: providerId,
      request_id: input.request_id ?? null,
      quote_number: quoteNumber,
      line_items: input.line_items,
      subtotal,
      total_amount: subtotal,
      status: "draft",
      valid_until: validUntil,
      notes: input.notes ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create quote: ${error.message}`);
  return data as Quote;
}

// ---------------------------------------------------------------------------
// updateQuote
// ---------------------------------------------------------------------------

/**
 * Updates a quote. Only permitted when the quote status is 'draft'.
 * Recomputes subtotal/total if line_items are provided in the update.
 * Returns the updated quote.
 */
export async function updateQuote(
  supabase: SupabaseClient,
  providerId: string,
  quoteId: string,
  updates: UpdateQuoteInput,
): Promise<Quote> {
  // Fetch current quote to check status and ownership
  const { data: existing, error: fetchError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to fetch quote: ${fetchError.message}`);
  if (!existing) throw new Error("Quote not found");

  const quote = existing as Quote;

  if (quote.status !== "draft") {
    throw new Error(
      `Quote cannot be updated: current status is '${quote.status}'. Only draft quotes can be updated.`,
    );
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.line_items !== undefined) {
    validateLineItems(updates.line_items);
    const subtotal = computeSubtotal(updates.line_items);
    patch["line_items"] = updates.line_items;
    patch["subtotal"] = subtotal;
    patch["total_amount"] = subtotal;
  }

  if (updates.notes !== undefined) {
    patch["notes"] = updates.notes;
  }

  if (updates.valid_until_days !== undefined) {
    patch["valid_until"] = addDays(updates.valid_until_days);
  }

  const { data, error } = await supabase
    .from("quotes")
    .update(patch)
    .eq("id", quoteId)
    .eq("provider_id", providerId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to update quote: ${error.message}`);
  return data as Quote;
}

// ---------------------------------------------------------------------------
// sendQuote
// ---------------------------------------------------------------------------

/**
 * Transitions a quote from 'draft' to 'sent' status.
 * Throws if the quote is not in draft status.
 *
 * TODO: fire Inngest event `provider/quote.sent` with { quoteId, providerId }
 * so that downstream notifications (email to client) can be triggered.
 */
export async function sendQuote(
  supabase: SupabaseClient,
  providerId: string,
  quoteId: string,
): Promise<Quote> {
  // Fetch quote to verify ownership and current status
  const { data: existing, error: fetchError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to fetch quote: ${fetchError.message}`);
  if (!existing) throw new Error("Quote not found");

  const quote = existing as Quote;

  if (quote.status !== "draft") {
    throw new Error(
      `Quote cannot be sent: current status is '${quote.status}'. Only draft quotes can be sent.`,
    );
  }

  const { data, error } = await supabase
    .from("quotes")
    .update({ status: "sent", updated_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("provider_id", providerId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to send quote: ${error.message}`);
  return data as Quote;
}

// ---------------------------------------------------------------------------
// getQuotesByProvider
// ---------------------------------------------------------------------------

/**
 * Returns all quotes for the provider, optionally filtered by status.
 * Includes related service_request info. Ordered by created_at DESC.
 */
export async function getQuotesByProvider(
  supabase: SupabaseClient,
  providerId: string,
  status?: QuoteStatus,
): Promise<QuoteWithRequest[]> {
  let query = supabase
    .from("quotes")
    .select(
      `
      *,
      service_requests (
        id,
        title,
        category,
        status
      )
    `,
    )
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  if (status !== undefined) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch quotes: ${error.message}`);
  if (!data) return [];

  return (data as Array<Record<string, unknown>>).map((row): QuoteWithRequest => {
    const sr = Array.isArray(row["service_requests"])
      ? (row["service_requests"][0] as Record<string, unknown> | undefined)
      : (row["service_requests"] as Record<string, unknown> | undefined);

    return {
      id: row["id"] as string,
      provider_id: row["provider_id"] as string,
      request_id: (row["request_id"] as string | null) ?? null,
      quote_number: row["quote_number"] as string,
      line_items: (row["line_items"] as QuoteLineItem[]) ?? [],
      subtotal: row["subtotal"] as number,
      total_amount: row["total_amount"] as number,
      status: row["status"] as QuoteStatus,
      valid_until: (row["valid_until"] as string | null) ?? null,
      notes: (row["notes"] as string | null) ?? null,
      created_at: row["created_at"] as string,
      updated_at: row["updated_at"] as string,
      service_request: sr
        ? {
            id: sr["id"] as string,
            title: (sr["title"] as string | undefined) ?? "",
            category: (sr["category"] as string | undefined) ?? "",
            status: (sr["status"] as string | undefined) ?? "",
          }
        : null,
    };
  });
}

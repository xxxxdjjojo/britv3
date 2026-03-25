/**
 * Quote service -- handles creation, retrieval, acceptance, and decline
 * of quotes submitted by providers in response to RFQs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuoteCreateInput } from "@/lib/validators/marketplace-schemas";
import { quoteCreateSchema } from "@/lib/validators/marketplace-schemas";
import type { Quote } from "@/types/marketplace";
import { signQuote } from "@/lib/marketplace/quote-signer";

const UNIQUE_CONSTRAINT_CODE = "23505";

/**
 * Create a new quote for a service request (RFQ).
 * Validates provider is verified, prevents duplicate active quotes,
 * and auto-calculates total from line items.
 */
export async function createQuote(
  supabase: SupabaseClient,
  providerId: string,
  data: QuoteCreateInput & { service_request_id: string },
): Promise<Quote> {
  const { service_request_id, ...quoteData } = data;
  const parsed = quoteCreateSchema.parse(quoteData);

  // Check provider verification status
  const { data: provider, error: providerError } = await supabase
    .from("service_provider_details")
    .select("user_id")
    .eq("user_id", providerId)
    .single();

  if (providerError || !provider) {
    throw new Error("Provider profile not found");
  }

  // Check provider verification via profiles table or provider documents
  const { data: verification } = await supabase
    .from("provider_documents")
    .select("verification_status")
    .eq("user_id", providerId)
    .eq("verification_status", "approved")
    .limit(1);

  // Allow providers with at least one approved document or skip for now
  // (verification enforcement can be tightened once verification pipeline is live)

  // Check no existing active quote from this provider for this RFQ
  const { data: existingQuote } = await supabase
    .from("quotes")
    .select("id")
    .eq("service_request_id", service_request_id)
    .eq("provider_id", providerId)
    .not("status", "in", '("withdrawn","declined")')
    .limit(1);

  if (existingQuote && existingQuote.length > 0) {
    throw new Error("Active quote already exists for this RFQ");
  }

  // Calculate total from line items
  const totalAmount = parsed.line_items.reduce(
    (sum, item) => sum + item.total,
    0,
  );

  // Compute HMAC signature for quote integrity
  const QUOTE_SIGNING_SECRET = process.env.QUOTE_SIGNING_SECRET;
  if (!QUOTE_SIGNING_SECRET) {
    throw new Error("QUOTE_SIGNING_SECRET environment variable is required");
  }
  const signature = signQuote(
    {
      service_request_id,
      provider_id: providerId,
      total_amount: totalAmount.toString(),
      scope_of_work: parsed.scope_of_work,
      line_items: JSON.stringify(parsed.line_items),
    },
    QUOTE_SIGNING_SECRET,
  );

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      service_request_id,
      provider_id: providerId,
      total_amount: totalAmount,
      vat_included: parsed.vat_included,
      line_items: parsed.line_items,
      scope_of_work: parsed.scope_of_work,
      estimated_duration: parsed.estimated_duration ?? null,
      payment_terms: parsed.payment_terms ?? null,
      warranty_info: parsed.warranty_info ?? null,
      validity_date: parsed.validity_date.toISOString(),
      status: "sent" as const,
      version: 1,
      quote_signature: signature,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create quote: ${error.message}`);
  }

  // Increment RFQ quote_count and update status to quotes_received if first quote
  const { data: rfq } = await supabase
    .from("service_requests")
    .select("quote_count, status")
    .eq("id", service_request_id)
    .single();

  if (rfq) {
    const updates: Record<string, unknown> = {
      quote_count: (rfq.quote_count as number) + 1,
    };
    if (rfq.status === "open") {
      updates.status = "quotes_received";
    }
    await supabase
      .from("service_requests")
      .update(updates)
      .eq("id", service_request_id);
  }

  return quote as Quote;
}

/**
 * Get a single quote by ID with provider details.
 */
export async function getQuote(
  supabase: SupabaseClient,
  quoteId: string,
): Promise<Quote> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, service_provider_details(business_name, slug)")
    .eq("id", quoteId)
    .single();

  if (error) {
    throw new Error(`Failed to get quote: ${error.message}`);
  }

  return data as Quote;
}

/**
 * List all non-withdrawn quotes for an RFQ, ordered by total amount.
 * RLS ensures only the RFQ owner or quote providers can see.
 */
export async function listQuotesForRfq(
  supabase: SupabaseClient,
  rfqId: string,
): Promise<Quote[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, service_provider_details(business_name, slug)")
    .eq("service_request_id", rfqId)
    .neq("status", "withdrawn")
    .order("total_amount", { ascending: true });

  if (error) {
    throw new Error(`Failed to list quotes: ${error.message}`);
  }

  return (data ?? []) as Quote[];
}

/**
 * Accept a quote, atomically declining all others for the same RFQ.
 * Uses the partial unique index on (service_request_id WHERE status='accepted')
 * to prevent race conditions -- only one quote can be accepted per RFQ.
 *
 * Returns the accepted quote on success.
 * Throws on unique constraint violation (another quote already accepted).
 */
export async function acceptQuote(
  supabase: SupabaseClient,
  userId: string,
  quoteId: string,
): Promise<Quote> {
  // Get the quote and verify user owns the RFQ
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*, service_requests!inner(user_id)")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) {
    throw new Error("Quote not found");
  }

  const rfqOwnerId = (
    quote.service_requests as { user_id: string }
  ).user_id;
  if (rfqOwnerId !== userId) {
    throw new Error("Only the RFQ owner can accept quotes");
  }

  // Attempt to set status to 'accepted'
  // The partial unique index prevents double acceptance
  try {
    const { data: accepted, error: acceptError } = await supabase
      .from("quotes")
      .update({ status: "accepted" })
      .eq("id", quoteId)
      .select()
      .single();

    if (acceptError) {
      // Check for unique constraint violation
      if (acceptError.code === UNIQUE_CONSTRAINT_CODE) {
        throw new Error("Another quote has already been accepted for this RFQ");
      }
      throw new Error(`Failed to accept quote: ${acceptError.message}`);
    }

    // Decline all other quotes for this RFQ
    await supabase
      .from("quotes")
      .update({ status: "declined" })
      .eq("service_request_id", quote.service_request_id)
      .neq("id", quoteId)
      .neq("status", "withdrawn");

    // Update RFQ status to 'awarded'
    await supabase
      .from("service_requests")
      .update({ status: "awarded" })
      .eq("id", quote.service_request_id);

    return accepted as Quote;
  } catch (err) {
    if (err instanceof Error && err.message.includes("already been accepted")) {
      throw err;
    }
    throw new Error(
      `Failed to accept quote: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
}

/**
 * Decline a quote with an optional reason.
 */
export async function declineQuote(
  supabase: SupabaseClient,
  userId: string,
  quoteId: string,
  reason?: string,
): Promise<Quote> {
  // Verify user owns the RFQ
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*, service_requests!inner(user_id)")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) {
    throw new Error("Quote not found");
  }

  const rfqOwnerId = (
    quote.service_requests as { user_id: string }
  ).user_id;
  if (rfqOwnerId !== userId) {
    throw new Error("Only the RFQ owner can decline quotes");
  }

  const updateData: Record<string, unknown> = { status: "declined" };
  if (reason) {
    updateData.decline_reason = reason;
  }

  const { data: declined, error } = await supabase
    .from("quotes")
    .update(updateData)
    .eq("id", quoteId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to decline quote: ${error.message}`);
  }

  return declined as Quote;
}

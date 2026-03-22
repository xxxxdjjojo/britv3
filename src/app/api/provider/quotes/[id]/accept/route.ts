/**
 * POST /api/provider/quotes/[id]/accept
 *
 * Called by the CLIENT (homeowner/service-request owner) to accept a quote.
 * Auth check verifies the user is the service_request owner for the quote.
 * On success, fires an Inngest event to create a booking asynchronously.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptQuote } from "@/services/provider/provider-quote-service";

type Params = Promise<{ id: string }>;

export async function POST(
  _request: Request,
  { params }: { params: Params },
) {
  const { id: quoteId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let quote: Awaited<ReturnType<typeof acceptQuote>>;

  try {
    quote = await acceptQuote(supabase, quoteId, user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Use 403 for ownership/permission errors, 400 for state errors
    const status =
      message.includes("Only the service request owner") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  // Fire Inngest event to create booking asynchronously
  try {
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "provider/quote.accepted",
      data: {
        quoteId: quote.id,
        providerId: quote.provider_id,
        requestId: quote.request_id,
        userId: user.id,
      },
    });
  } catch (inngestErr) {
    // Log but do not fail the request — quote is already accepted
    console.error("Failed to send Inngest event for quote acceptance:", inngestErr);
  }

  return NextResponse.json(
    { quote, message: "Quote accepted. Booking will be created shortly." },
    { status: 200 },
  );
}

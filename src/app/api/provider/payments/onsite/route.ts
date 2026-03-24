/**
 * POST /api/provider/payments/onsite
 *
 * Creates a Stripe PaymentIntent for on-site payment collection.
 * Requires: authenticated provider with a Stripe Connect account that has charges_enabled.
 *
 * Body: { invoiceId: string }
 * Returns: OnsitePaymentIntent { clientSecret, paymentIntentId, amountPence, invoiceId }
 */

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { resolveProviderId } from "@/lib/provider/resolve-provider";
import { createOnsitePaymentIntent } from "@/services/provider/provider-onsite-payment-service";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { providerId } = await resolveProviderId(supabase);
    const body = await request.json();
    const { invoiceId } = body as { invoiceId?: unknown };

    if (!invoiceId || typeof invoiceId !== "string") {
      return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
    }

    const result = await createOnsitePaymentIntent(providerId, invoiceId, supabase);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not found") || message.includes("not owned")
      ? 404
      : message.includes("not enabled")
        ? 422
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * POST /api/provider/payments/onsite/confirm
 *
 * Confirms an on-site Stripe PaymentIntent and marks the invoice as paid if succeeded.
 * Requires: authenticated provider.
 *
 * Body: { paymentIntentId: string }
 * Returns: PaymentConfirmation { status, invoiceId, paidAt }
 */

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { resolveProviderId } from "@/lib/provider/resolve-provider";
import { confirmOnsitePayment } from "@/services/provider/provider-onsite-payment-service";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { providerId } = await resolveProviderId(supabase);
    const body = await request.json();
    const { paymentIntentId } = body as { paymentIntentId?: unknown };

    if (!paymentIntentId || typeof paymentIntentId !== "string") {
      return NextResponse.json({ error: "paymentIntentId required" }, { status: 400 });
    }

    const result = await confirmOnsitePayment(providerId, paymentIntentId, supabase);
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

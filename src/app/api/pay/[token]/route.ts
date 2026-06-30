/**
 * POST /api/pay/[token]
 *
 * Account-free invoice payment. Verifies the signed pay-token, then creates (or
 * reuses) a PaymentIntent for the invoice and returns its client secret so the
 * customer can confirm payment with Stripe Elements. The amount is recomputed
 * server-side; the invoice is only marked paid by the Stripe webhook.
 */

import { NextRequest, NextResponse } from "next/server";

import { createPaymentIntentForToken } from "@/services/provider/invoice-pay-service";

type Params = Promise<{ token: string }>;

export async function POST(_request: NextRequest, { params }: { params: Params }) {
  const { token } = await params;

  try {
    const intent = await createPaymentIntentForToken(token);
    return NextResponse.json({
      clientSecret: intent.clientSecret,
      amountPence: intent.amountPence,
      invoiceId: intent.invoiceId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to start payment";
    const status = /invalid|expired/i.test(message)
      ? 404
      : /already been paid/i.test(message)
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * POST /api/provider/invoices/[id]/send
 *
 * Transitions an invoice to 'sent' and emails the customer a secure pay link.
 * Gated: a trader can only send invoices once fully set up. The status
 * transition is authoritative; the customer email is best-effort.
 */

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  invoiceTotalPence,
  sendInvoice,
} from "@/services/provider/provider-invoice-service";
import { checkProviderCanTransact } from "@/services/provider/provider-transaction-gate";
import { buildInvoicePayUrl } from "@/services/provider/invoice-pay-service";
import { sendTradeInvoice } from "@/services/email/email-service";

type Params = Promise<{ id: string }>;

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export async function POST(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("business_name, trading_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = user.id;

  const gate = await checkProviderCanTransact(supabase, user.id, {
    emailConfirmed: Boolean(user.email_confirmed_at),
  });
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.message, reason: gate.reason }, { status: 403 });
  }

  let invoice;
  try {
    invoice = await sendInvoice(supabase, providerId, id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to send invoice";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const payUrl = buildInvoicePayUrl(id);

  // Best-effort: email the customer the invoice + pay link. Never fail the send.
  try {
    const admin = createAdminClient();
    const { data: customer } = await admin
      .from("profiles")
      .select("email, first_name")
      .eq("id", invoice.client_id)
      .maybeSingle();

    const customerEmail = (customer as { email?: string } | null)?.email;
    if (customerEmail) {
      const providerName =
        (providerProfile as { trading_name?: string; business_name?: string } | null)
          ?.trading_name ||
        (providerProfile as { business_name?: string } | null)?.business_name ||
        "Your trader";
      await sendTradeInvoice({
        userId: invoice.client_id,
        email: customerEmail,
        customerName: (customer as { first_name?: string } | null)?.first_name,
        providerName,
        invoiceNumber: invoice.invoice_number,
        amountFormatted: formatGbp(invoiceTotalPence(invoice.line_items ?? [])),
        payUrl,
        dueDate: invoice.due_date,
      });
    }
  } catch {
    // best-effort email — the invoice is sent regardless
  }

  return NextResponse.json({ invoice, payUrl });
}

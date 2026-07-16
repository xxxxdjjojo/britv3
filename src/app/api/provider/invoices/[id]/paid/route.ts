/**
 * PATCH /api/provider/invoices/[id]/paid
 *
 * Marks an invoice as paid. Idempotency: throws if already paid (handled by service).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";
import { markInvoicePaid } from "@/services/provider/provider-invoice-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const { id: invoiceId } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = (providerProfile?.id as string | null | undefined) ?? user.id;

  try {
    const invoice = await markInvoicePaid(supabase, providerId, invoiceId);
    return NextResponse.json(invoice);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") || message.includes("already marked")
      ? 409
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

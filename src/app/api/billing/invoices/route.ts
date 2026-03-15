/**
 * GET /api/billing/invoices
 * Returns the authenticated user's invoice history from Stripe.
 *
 * GET /api/billing/invoices?refresh=<invoiceId>
 * Re-fetches a single invoice to get a fresh PDF URL (Stripe URLs expire).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInvoices, refreshInvoicePdf } from "@/services/billing/billing-service";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const refreshId = searchParams.get("refresh");

  try {
    if (refreshId) {
      // Security: verify this invoice belongs to the user before refreshing
      // We do this by fetching all invoices and checking the ID is in the list
      const invoices = await getInvoices(supabase, user.id, 100);
      const match = invoices.find((inv) => inv.id === refreshId);

      if (!match) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      const pdfUrl = await refreshInvoicePdf(refreshId);
      return NextResponse.json({ url: pdfUrl });
    }

    const invoices = await getInvoices(supabase, user.id);
    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("[billing/invoices] Failed to fetch invoices:", err);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

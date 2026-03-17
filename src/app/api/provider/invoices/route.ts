/**
 * /api/provider/invoices
 *
 * POST — create a new invoice (draft) for the authenticated provider
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateInvoice } from "@/services/provider/provider-invoice-service";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const lineItemSchema = z.object({
  name: z.string().min(1, "Line item name is required"),
  description: z.string().optional(),
  quantity: z.number().int().min(1),
  unit_price_pence: z.number().int().min(0),
  total_pence: z.number().int().min(0),
  vat_rate: z.number().min(0).max(1).optional(),
});

const createInvoiceSchema = z.object({
  booking_id: z.string().uuid().optional(),
  client_id: z.string().min(1, "client_id is required"),
  line_items: z.array(lineItemSchema).min(1, "At least one line item is required"),
  due_date_days: z.number().int().min(1).max(365).optional(),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/provider/invoices
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createInvoiceSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const invoice = await generateInvoice(supabase, providerId, parsed.data);
    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

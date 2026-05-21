/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * GET /api/billing/proration?priceId=price_xxx
 *
 * Returns the prorated amount due if the user upgrades to the given price.
 * Used on the subscription upgrade confirmation screen.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPriceIdAllowed } from "@/lib/billing-config";
import { getUpcomingInvoice } from "@/services/billing/billing-service";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const priceId = searchParams.get("priceId");

  if (!priceId) {
    return NextResponse.json({ error: "priceId query param is required" }, { status: 400 });
  }

  if (!isPriceIdAllowed(priceId)) {
    return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
  }

  try {
    const preview = await getUpcomingInvoice(supabase, user.id, priceId);
    if (!preview) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }
    return NextResponse.json(preview);
  } catch (err) {
    console.error("[billing/proration] Failed to retrieve upcoming invoice:", err);
    return NextResponse.json({ error: "Failed to calculate proration" }, { status: 500 });
  }
}

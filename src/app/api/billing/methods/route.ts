/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * GET    /api/billing/methods          — list saved payment methods
 * POST   /api/billing/methods          — set default payment method
 * DELETE /api/billing/methods?id=pm_X  — detach a payment method
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPaymentMethods,
  detachPaymentMethod,
  setDefaultPaymentMethod,
} from "@/services/billing/billing-service";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const methods = await getPaymentMethods(supabase, user.id);
    return NextResponse.json({ methods });
  } catch (err) {
    console.error("[billing/methods] Failed to list payment methods:", err);
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { pm_id?: string };
  try {
    body = (await request.json()) as { pm_id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.pm_id) {
    return NextResponse.json({ error: "pm_id is required" }, { status: 400 });
  }

  try {
    await setDefaultPaymentMethod(supabase, user.id, body.pm_id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[billing/methods] Failed to set default payment method:", err);
    return NextResponse.json({ error: "Failed to update default payment method" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pmId = searchParams.get("id");

  if (!pmId) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 });
  }

  try {
    await detachPaymentMethod(supabase, user.id, pmId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove payment method";
    const isGuardError = message.startsWith("Cannot remove your only payment method");
    console.error("[billing/methods] Failed to detach payment method:", err);
    return NextResponse.json({ error: message }, { status: isGuardError ? 422 : 500 });
  }
}

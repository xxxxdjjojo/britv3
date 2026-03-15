/**
 * GET /api/billing/session/:sessionId
 *
 * Returns minimal details about a completed Stripe Checkout session.
 * Used by the payment confirmation page to display accurate details
 * when the ?session_id= param is present in the success URL.
 *
 * Security:
 * - Requires authentication.
 * - Only returns non-sensitive fields (status, email, amount).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCheckoutSession } from "@/services/billing/billing-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  if (!sessionId?.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  try {
    const session = await getCheckoutSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (err) {
    console.error("[billing/session] Failed to retrieve session:", err);
    return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
  }
}

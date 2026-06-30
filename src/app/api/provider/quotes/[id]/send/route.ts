/**
 * POST /api/provider/quotes/[id]/send
 *
 * Transitions a draft quote to 'sent' status.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendQuote } from "@/services/provider/provider-quote-service";
import { checkProviderCanTransact } from "@/services/provider/provider-transaction-gate";

type Params = Promise<{ id: string }>;

export async function POST(
  _request: NextRequest,
  { params }: { params: Params },
) {
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
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  // Action-level gate: a trader can only send LIVE quotes once fully set up.
  const gate = await checkProviderCanTransact(supabase, user.id, {
    emailConfirmed: Boolean(user.email_confirmed_at),
  });
  if (!gate.allowed) {
    return NextResponse.json(
      { error: gate.message, reason: gate.reason },
      { status: 403 },
    );
  }

  try {
    const quote = await sendQuote(supabase, providerId, id);
    return NextResponse.json(quote);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

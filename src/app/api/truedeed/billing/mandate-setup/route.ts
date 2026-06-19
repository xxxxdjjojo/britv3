/**
 * POST /api/truedeed/billing/mandate-setup — start the hosted GoCardless
 * Bacs mandate setup for the signed-in agent (billing spec §1 onboarding).
 *
 * Returns { authorisationUrl } for the client to redirect the director to
 * the GoCardless hosted page. The mandate ids are persisted by the webhook
 * when the flow completes.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMandateSetupFlow } from "@/services/truedeed/mandate-service";

const ERROR_RESPONSES: Record<
  "not_configured" | "not_found" | "internal",
  { status: number; message: string }
> = {
  not_configured: {
    status: 503,
    message: "Direct Debit billing is not yet enabled.",
  },
  not_found: {
    status: 404,
    message: "No agency profile found for your account.",
  },
  internal: {
    status: 500,
    message: "Failed to start Direct Debit setup. Please try again.",
  },
};

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://truedeed.co.uk";
  const billingUrl = `${appUrl}/dashboard/agent/billing/truedeed`;

  const result = await createMandateSetupFlow(
    user.id,
    `${billingUrl}?mandate=complete`,
    `${billingUrl}?mandate=exit`,
  );

  if ("error" in result) {
    const { status, message } = ERROR_RESPONSES[result.error];
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ authorisationUrl: result.authorisationUrl });
}

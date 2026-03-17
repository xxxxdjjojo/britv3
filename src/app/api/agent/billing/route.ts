import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createCheckoutSession,
  getCustomerPortalUrl,
} from "@/services/agent/agent-billing-service";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action } = body as { action?: string };

  try {
    if (action === "checkout") {
      const { priceId, successUrl, cancelUrl } = body as {
        priceId?: string;
        successUrl?: string;
        cancelUrl?: string;
      };

      if (!priceId || !successUrl || !cancelUrl) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const url = await createCheckoutSession(user.id, priceId, successUrl, cancelUrl);
      return NextResponse.json({ url });
    }

    if (action === "portal") {
      const { returnUrl } = body as { returnUrl?: string };

      if (!returnUrl) {
        return NextResponse.json({ error: "Missing returnUrl" }, { status: 400 });
      }

      const url = await getCustomerPortalUrl(supabase, user.id, returnUrl);
      return NextResponse.json({ url });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message.includes("Stripe not configured")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

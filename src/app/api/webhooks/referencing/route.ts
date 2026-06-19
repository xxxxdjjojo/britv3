/**
 * POST /api/webhooks/referencing
 *
 * Inbound webhook from the tenant-referencing provider. The active adapter
 * verifies the signature against the RAW body, then the outcome is applied to
 * the matching application via its external reference. Unauthenticated — trust
 * comes solely from the signature, so verification happens before any DB write.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProvider, applyReferencingOutcome } from "@/services/referencing/referencing-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-referencing-signature") ??
    request.headers.get("x-signature");

  const provider = getProvider();
  const parsed = provider.parseWebhook(rawBody, signature);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid signature or payload" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { matched } = await applyReferencingOutcome(
      supabase,
      parsed.externalRef,
      parsed.outcome,
    );
    if (!matched) {
      // Acknowledge unknown refs so the provider stops retrying.
      return NextResponse.json({ received: true, matched: false }, { status: 200 });
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    // 500 so the provider redelivers.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

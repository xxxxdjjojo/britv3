/**
 * POST /api/provider/references/[id]/cancel
 *
 * Trader-facing endpoint to cancel (revoke) a pending/sent reference invitation.
 *
 * Auth via the cookie-based server client; the write uses the SERVICE-ROLE admin
 * client (RLS blocks trader writes). The service flips the row to `revoked`.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { createRateLimiter } from "@/lib/cache/redis";
import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelReferenceInvitation } from "@/services/provider/reference-invitation-service";

type Params = Promise<{ id: string }>;

// 10 cancels/min/user — fails open on Redis outage. Only blunts burst abuse.
const cancelLimiter = createRateLimiter(10, "1 m");

export async function POST(
  _req: Request,
  { params }: { params: Params },
): Promise<NextResponse> {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rl = await cancelLimiter.limit(`reference_cancel:${user.id}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Reject non-UUID ids before hitting the DB; 404 so we never leak existence.
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const result = await cancelReferenceInvitation(admin, {
    referenceId: id,
    providerId: user.id,
  });

  if (!result.success) {
    const status =
      result.code === "not_cancellable"
        ? 409
        : result.code === "not_found"
          ? 404
          : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateApplicationStatus } from "@/services/landlord/tenant-application-service";
import { startReferencing } from "@/services/referencing/referencing-service";

/**
 * POST /api/landlord/applications/[id]/referencing
 * Transition a shortlisted application into the referencing stage. Runs
 * server-side so the referencing kick-off (Inngest dispatch) has its signing
 * key. Ownership is enforced by the service via landlord_id = auth user.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const application = await updateApplicationStatus(supabase, id, "referencing");
    // Kick off referencing here (server-only) so the inngest dispatch never
    // reaches a client bundle. Best-effort — the transition already succeeded.
    try {
      await startReferencing(supabase, id);
    } catch (refErr) {
      console.warn("[applications/referencing] startReferencing failed:", refErr);
    }
    return NextResponse.json({
      status: application.status,
      credit_check_status: application.credit_check_status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start referencing";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

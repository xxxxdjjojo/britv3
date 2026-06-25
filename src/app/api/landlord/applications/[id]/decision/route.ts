import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  acceptApplication,
  rejectApplication,
} from "@/services/landlord/tenant-application-service";

const DecisionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept") }),
  z.object({
    action: z.literal("reject"),
    reason: z.string().trim().min(10, "Please provide a reason of at least 10 characters"),
  }),
]);

/**
 * POST /api/landlord/applications/[id]/decision
 * Accept or reject a tenant application. Runs server-side so the Resend email
 * actually sends (RESEND_API_KEY is server-only) and ownership is enforced by
 * the service via landlord_id = auth user.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = DecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid decision", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.action === "accept") {
      await acceptApplication(supabase, id);
      return NextResponse.json({ status: "approved" });
    }
    await rejectApplication(supabase, id, parsed.data.reason);
    return NextResponse.json({ status: "rejected" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record decision";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

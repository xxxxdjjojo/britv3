import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST /api/properties/[id]/view
//
// Records a property view. No auth required — anonymous users can insert.
// Rate limit: 1 view per session_id per property per 10 minutes (DB check).
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: propertyId } = await params;

  // Read session_id from request body; fall back to a generated one
  let sessionId: string;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const candidate = body["session_id"];
    sessionId =
      typeof candidate === "string" && candidate.length > 0
        ? candidate
        : crypto.randomUUID();
  } catch {
    sessionId = crypto.randomUUID();
  }

  const supabase = await createClient();

  // ------------------------------------------------------------------
  // Idempotency check: was this session_id+property seen in last 10 min?
  // ------------------------------------------------------------------
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("property_views")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .eq("session_id", sessionId)
    .gte("viewed_at", tenMinutesAgo);

  if ((count ?? 0) > 0) {
    // Already recorded — return 200 silently (fire-and-forget callers ignore errors)
    return NextResponse.json({ ok: true });
  }

  // ------------------------------------------------------------------
  // Insert view record
  // ------------------------------------------------------------------
  await supabase.from("property_views").insert({
    property_id: propertyId,
    session_id: sessionId,
    viewed_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

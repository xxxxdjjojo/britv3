import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST /api/properties/[id]/view
//
// Records a property view. No auth required — anonymous users can insert.
// Uses upsert with ON CONFLICT to atomically deduplicate views.
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: propertyId } = await params;

  // Read session_id from request body; fall back to a generated one
  // Cap at 64 chars to prevent storage abuse
  let sessionId: string;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const candidate = body["session_id"];
    sessionId =
      typeof candidate === "string" && candidate.length > 0
        ? candidate.slice(0, 64)
        : crypto.randomUUID();
  } catch {
    sessionId = crypto.randomUUID();
  }

  const supabase = await createClient();

  // ------------------------------------------------------------------
  // Upsert: insert view or silently skip if already recorded recently.
  // Relies on a UNIQUE constraint on property_views(property_id, session_id)
  // to prevent duplicates atomically (no TOCTOU race).
  // ------------------------------------------------------------------
  await supabase.from("property_views").upsert(
    {
      property_id: propertyId,
      session_id: sessionId,
      created_at: new Date().toISOString(),
    },
    { onConflict: "property_id,session_id", ignoreDuplicates: true },
  );

  return NextResponse.json({ ok: true });
}

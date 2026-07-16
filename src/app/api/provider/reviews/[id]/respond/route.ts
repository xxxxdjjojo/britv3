import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";

const MIN_CHARS = 10;
const MAX_CHARS = 500;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const { id } = await params;

  const supabase = await createClient();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // ── Fetch review ──────────────────────────────────────────────────────────
  const { data: review, error: fetchErr } = await supabase
    .from("reviews")
    .select("id, reviewee_id, provider_response")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // ── Ownership check ───────────────────────────────────────────────────────
  if ((review as { reviewee_id: string }).reviewee_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Already responded? ────────────────────────────────────────────────────
  if ((review as { provider_response: string | null }).provider_response) {
    return NextResponse.json(
      { error: "You have already responded to this review." },
      { status: 409 },
    );
  }

  // ── Parse + validate body ─────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const responseText =
    body !== null &&
    typeof body === "object" &&
    "response" in body &&
    typeof (body as { response: unknown }).response === "string"
      ? ((body as { response: string }).response).trim()
      : null;

  if (!responseText) {
    return NextResponse.json({ error: "Response is required." }, { status: 400 });
  }

  if (responseText.length < MIN_CHARS) {
    return NextResponse.json(
      { error: `Response must be at least ${MIN_CHARS} characters.` },
      { status: 400 },
    );
  }

  if (responseText.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Response must not exceed ${MAX_CHARS} characters.` },
      { status: 400 },
    );
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from("reviews")
    .update({ provider_response: responseText })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json(
      { error: "Failed to save response. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

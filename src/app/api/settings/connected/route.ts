import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";

// ---------------------------------------------------------------------------
// GET /api/settings/connected
// Returns the user's linked identity providers (Google, GitHub, etc.).
// ---------------------------------------------------------------------------

export async function GET() {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  try {
    const { data, error: idError } = await supabase!.auth.getUserIdentities();

    if (idError) {
      return NextResponse.json(
        { identities: [], error: "unavailable" },
        { status: 200 },
      );
    }

    return NextResponse.json({ identities: data?.identities ?? [] });
  } catch {
    return NextResponse.json(
      { identities: [], error: "unavailable" },
      { status: 200 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/settings/connected?identity_id=<id>
// Unlinks an OAuth provider. Guards against removing the last login method.
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const identityId = searchParams.get("identity_id");

  if (!identityId || !identityId.trim()) {
    return NextResponse.json(
      { error: "identity_id is required" },
      { status: 400 },
    );
  }

  // --- Last-provider guard ---
  const { data: identities } = await supabase!.auth.getUserIdentities();
  const linkedProviders = identities?.identities ?? [];

  if (linkedProviders.length <= 1) {
    const hasEmailProvider = linkedProviders.some(
      (i) => i.provider === "email",
    );
    if (!hasEmailProvider) {
      return NextResponse.json(
        {
          error:
            "Cannot disconnect your only login method. Set a password first.",
        },
        { status: 400 },
      );
    }
  }

  // --- Unlink the identity ---
  try {
    // Find the full identity object (SDK requires UserIdentity, not just id)
    const targetIdentity = linkedProviders.find((i) => i.id === identityId);
    if (!targetIdentity) {
      return NextResponse.json(
        { error: "Identity not found" },
        { status: 404 },
      );
    }

    const { error: unlinkError } = await supabase!.auth.unlinkIdentity(
      targetIdentity,
    );

    if (unlinkError) {
      return NextResponse.json(
        { error: unlinkError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to unlink" },
      { status: 500 },
    );
  }
}

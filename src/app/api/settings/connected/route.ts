import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { canUnlinkIdentity } from "@/lib/auth/last-provider-guard";

// ---------------------------------------------------------------------------
// GET /api/settings/connected
// Returns the user's linked OAuth identities.
// ---------------------------------------------------------------------------

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { supabase } = auth;

  const { data, error } = await supabase.auth.getUserIdentities();

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Failed to load identities" },
      { status: 500 },
    );
  }

  return NextResponse.json({ identities: data?.identities ?? [] });
}

// ---------------------------------------------------------------------------
// DELETE /api/settings/connected?identity_id=<id>
// Unlinks an OAuth provider. Blocks if it's the user's only login method.
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const identityId = searchParams.get("identity_id");

  if (!identityId || !identityId.trim()) {
    return NextResponse.json(
      { error: "identity_id is required" },
      { status: 400 },
    );
  }

  // Fetch current identities for the guard check
  const { data, error: listError } = await supabase.auth.getUserIdentities();

  if (listError || !data?.identities) {
    return NextResponse.json(
      { error: "Failed to load identities" },
      { status: 500 },
    );
  }

  // Guard: prevent unlinking the last login method
  const guard = canUnlinkIdentity(data.identities, identityId);

  if (!guard.allowed) {
    return NextResponse.json({ error: guard.reason }, { status: 400 });
  }

  // Find the identity to unlink
  const identity = data.identities.find((i) => i.identity_id === identityId);

  if (!identity) {
    return NextResponse.json(
      { error: "Identity not found" },
      { status: 404 },
    );
  }

  // Unlink using the user's JWT (not service role)
  const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);

  if (unlinkError) {
    return NextResponse.json(
      { error: unlinkError.message ?? "Failed to unlink identity" },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}

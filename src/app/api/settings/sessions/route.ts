import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// GET /api/settings/sessions
// Returns list of sessions for the authenticated user.
// Falls back to current session only if the admin SDK does not expose
// listUserSessions (depends on Supabase JS SDK version).
// ---------------------------------------------------------------------------

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Attempt to list all sessions via the admin client
  try {
    const admin = createAdminClient();

    // @ts-expect-error — listUserSessions may not be typed in all SDK versions
    if (typeof admin.auth.admin.listUserSessions === "function") {
      // @ts-expect-error — same as above
      const { data: sessionData, error: sessionError } =
        // @ts-expect-error — same as above
        await admin.auth.admin.listUserSessions({ userId: user.id });

      if (!sessionError && sessionData?.sessions) {
        // Identify the current session by comparing with the live session token
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        const sessions = (
          sessionData.sessions as Array<{
            id: string;
            user_agent?: string;
            created_at?: string;
            last_sign_in_at?: string;
            ip?: string;
          }>
        ).map((s) => ({
          id: s.id,
          user_agent: s.user_agent,
          created_at: s.created_at,
          last_sign_in_at: s.last_sign_in_at,
          ip: s.ip,
          is_current: s.id === currentSession?.access_token,
        }));

        return NextResponse.json({ sessions });
      }
    }
  } catch {
    // Fall through to current-session-only fallback
  }

  // Fallback: return only the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ sessions: [] });
  }

  const fallbackSession = {
    id: session.access_token.slice(0, 16),
    user_agent: undefined as string | undefined,
    created_at: undefined as string | undefined,
    last_sign_in_at: user.last_sign_in_at ?? undefined,
    ip: undefined as string | undefined,
    is_current: true,
  };

  return NextResponse.json({ sessions: [fallbackSession] });
}

// ---------------------------------------------------------------------------
// DELETE /api/settings/sessions?id=<session_id>
// Signs out a specific session (requires admin SDK).
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");

  if (!sessionId || !sessionId.trim()) {
    return NextResponse.json(
      { error: "Session id is required" },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();

    // @ts-expect-error — revokeUserSession may not be typed in all SDK versions
    if (typeof admin.auth.admin.revokeUserSession === "function") {
      // @ts-expect-error — same as above
      const { error } = await admin.auth.admin.revokeUserSession({
        sessionId,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }
  } catch {
    // Fall through
  }

  // If SDK does not support individual session revocation, return 501
  return NextResponse.json(
    {
      error:
        "Individual session sign-out is not supported by this Supabase SDK version. Use 'Sign Out of All Devices' instead.",
    },
    { status: 501 },
  );
}

import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type AuthSuccess = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  response?: never;
};

type AuthFailure = {
  supabase?: never;
  user?: never;
  response: NextResponse;
};

/**
 * Extracts auth boilerplate for API route handlers.
 * Returns `{ supabase, user }` on success, or `{ response }` on failure.
 *
 * Usage:
 * ```ts
 * const auth = await requireAuth();
 * if (auth.response) return auth.response;
 * const { supabase, user } = auth;
 * ```
 */
export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase, user };
}

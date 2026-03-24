import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAuthRateLimiter } from "@/lib/cache/redis";
import { issueReauthToken } from "@/lib/auth/reauth-token";

const rateLimiter = createAuthRateLimiter(5, "5 m");

export async function POST(request: NextRequest) {
  // 1. Authenticate the caller
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limit: 5 attempts per 5 minutes, keyed by user ID
  const { success: allowed } = await rateLimiter.limit(
    `reauth:${user.id}`,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  // 3. Parse request body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { password } = body as { password?: unknown };

  if (!password || typeof password !== "string") {
    return NextResponse.json(
      { error: "password is required" },
      { status: 400 },
    );
  }

  // 4. Verify password using a throwaway Supabase client.
  //    This avoids mutating the authenticated session or using the admin client.
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error } = await verifier.auth.signInWithPassword({
    email: user.email!,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 403 },
    );
  }

  // 5. Issue a short-lived reauth token
  const reauth_token = issueReauthToken(user.id);

  return NextResponse.json({ reauth_token });
}

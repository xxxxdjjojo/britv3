import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  // Check if user already has roles assigned
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    // If no roles, assign default homebuyer
    if (!roles || roles.length === 0) {
      await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "homebuyer" });
      await supabase
        .from("profiles")
        .update({ active_role: "homebuyer" })
        .eq("id", user.id);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}

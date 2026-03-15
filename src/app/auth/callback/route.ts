import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcome } from "@/services/email/email-service";

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

    // If no roles, assign default homebuyer — this is a brand-new user
    if (!roles || roles.length === 0) {
      await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "homebuyer" });
      await supabase
        .from("profiles")
        .update({ active_role: "homebuyer" })
        .eq("id", user.id);

      // Send welcome email to new users (fire-and-forget)
      if (user.email) {
        const firstName =
          (user.user_metadata?.display_name as string | undefined)?.split(" ")[0] ??
          (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
          "";
        void sendWelcome({
          userId: user.id,
          email: user.email,
          firstName,
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}

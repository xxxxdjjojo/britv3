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

    // If no roles, assign the intended role from signup metadata, or default to homebuyer
    if (!roles || roles.length === 0) {
      const intendedRole =
        (user.user_metadata?.intended_role as string | undefined) ?? "homebuyer";
      const validRoles = ["homebuyer", "renter", "seller", "agent", "landlord", "service_provider", "mortgage_broker"];
      const role = validRoles.includes(intendedRole) ? intendedRole : "homebuyer";

      const { error: roleError } = await supabase.rpc("assign_role_atomic", {
        p_user_id: user.id,
        p_role: role,
      });

      if (roleError) {
        return NextResponse.redirect(`${origin}/login?error=role_setup_failed`);
      }

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

      // New user → onboarding for their intended role
      return NextResponse.redirect(`${origin}/register/onboarding/${role}`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}

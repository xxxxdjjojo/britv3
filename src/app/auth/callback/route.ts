import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcome } from "@/services/email/email-service";
import type { UserRole } from "@/types/auth";

// Professional roles that can be set via the OAuth intent cookie
const VALID_PROFESSIONAL_ROLES: Record<string, UserRole> = {
  agent: "agent",
  seller: "seller",
  landlord: "landlord",
  provider: "service_provider",
  service_provider: "service_provider",
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  // Read professional role intent from cookie (set by OAuthButtons before redirect)
  const professionalRoleCookie = request.cookies.get("britestate_professional_role")?.value;
  const intendedRole: UserRole | null = professionalRoleCookie
    ? VALID_PROFESSIONAL_ROLES[decodeURIComponent(professionalRoleCookie)] ?? null
    : null;

  // Check if user already has roles assigned
  const { data: { user } } = await supabase.auth.getUser();
  let redirectPath = next;

  if (user) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    // If no roles, assign the intended role (or default to homebuyer)
    if (!roles || roles.length === 0) {
      const role = intendedRole ?? "homebuyer";

      await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role });
      await supabase
        .from("profiles")
        .update({ active_role: role })
        .eq("id", user.id);

      // Route to the correct onboarding flow
      if (intendedRole) {
        // Map role back to URL slug for onboarding
        const roleSlugMap: Record<string, string> = {
          service_provider: "provider",
          agent: "agent",
          seller: "seller",
          landlord: "landlord",
        };
        const slug = roleSlugMap[role] ?? role;
        redirectPath = `/register/onboarding/${slug}`;
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
    }
  }

  // Clear the intent cookie
  const response = NextResponse.redirect(`${origin}${redirectPath}`);
  if (professionalRoleCookie) {
    response.cookies.set("britestate_professional_role", "", {
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

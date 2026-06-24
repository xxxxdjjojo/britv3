import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcome } from "@/services/email/email-service";
import { resolveSafeNext } from "@/lib/auth/safe-redirect";
import type { UserRole } from "@/types/auth";

// Professional roles that can be set via the OAuth intent cookie
const VALID_PROFESSIONAL_ROLES: Record<string, UserRole> = {
  agent: "agent",
  seller: "seller",
  landlord: "landlord",
  provider: "service_provider",
  service_provider: "service_provider",
};

const VALID_SIGNUP_ROLE_INTENTS: Record<string, UserRole> = {
  homebuyer: "homebuyer",
  renter: "renter",
  seller: "seller",
  landlord: "landlord",
  agent: "agent",
  provider: "service_provider",
  service_provider: "service_provider",
  mortgage_broker: "mortgage_broker",
};

function safeRoleIntent(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;
  return VALID_SIGNUP_ROLE_INTENTS[value] ?? null;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = resolveSafeNext(searchParams.get("next"));

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
    const signupRoleIntent = safeRoleIntent(user.user_metadata?.role_intent);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    // If no roles, assign the intended role (or default to homebuyer)
    if (!roles || roles.length === 0) {
      const role = intendedRole ?? signupRoleIntent ?? "homebuyer";

      const { error: roleError } = await supabase.rpc("assign_role_atomic", {
        p_user_id: user.id,
        p_role: role,
      });

      // Route to the correct onboarding flow
      if (roleError) {
        redirectPath = "/register/role-select";
      } else if (intendedRole && redirectPath !== "/verify-email/confirmed") {
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

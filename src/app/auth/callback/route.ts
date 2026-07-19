import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcome } from "@/services/email/email-service";
import { inngest } from "@/inngest/client";
import { resolveSafeNext } from "@/lib/auth/safe-redirect";
import type { UserRole } from "@/types/auth";
import { attributeReferralAfterAuthentication } from "@/services/referrals/vouch-referral-service";
import { captureException } from "@/lib/observability/capture-exception";

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
  let referralAttributionComplete = false;

  if (user) {
    try {
      const attribution = await attributeReferralAfterAuthentication({
        userId: user.id,
        referralCode: request.cookies.get("britestate_ref")?.value,
        inviteToken: request.cookies.get("truedeed_invite")?.value,
      });
      referralAttributionComplete =
        attribution.attributed || attribution.outcome === "already_attributed";
    } catch (attributionError) {
      captureException(attributionError, {
        module: "referrals",
        feature: "signup-attribution",
        operation: "auth-callback",
      });
    }
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

        // Enrol into the role-based lifecycle email drip. Only on successful
        // role assignment; guarded + non-blocking so it never breaks the redirect.
        if (!roleError) {
          try {
            void inngest.send({
              name: "lifecycle/role.assigned",
              data: {
                userId: user.id,
                email: user.email,
                role,
                assignedAt: new Date().toISOString(),
              },
            });
          } catch {
            // best-effort — do not block the auth redirect on Inngest issues
          }
        }
      }
    }
  }

  // Clear one-time attribution cookies only after a durable DB outcome. On a
  // transient failure they remain available for the authenticated retry API.
  const response = NextResponse.redirect(`${origin}${redirectPath}`);
  if (professionalRoleCookie) {
    response.cookies.set("britestate_professional_role", "", {
      path: "/",
      maxAge: 0,
    });
  }

  if (referralAttributionComplete) {
    response.cookies.delete("britestate_ref");
    response.cookies.delete("truedeed_invite");
  }

  return response;
}

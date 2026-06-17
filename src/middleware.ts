import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PUBLIC_ROUTES, AUTH_ROUTES, ROUTE_TO_ROLE, ROLE_TO_ROUTE } from "@/lib/constants";
import { isFeatureEnabled } from "@/lib/features";
import { ADMIN_ROUTE_PERMISSIONS, hasPermission, type AdminRole } from "@/lib/admin-permissions";
import { captureException } from "@/lib/observability/capture-exception";
import { CORRELATION_ID_HEADER, getCorrelationId } from "@/lib/observability/correlation-id";

/** Profile columns fetched by the consolidated middleware query. */
type MiddlewareProfileData = {
  active_role: string | null;
  is_admin: boolean;
  admin_role: string | null;
  provider_verification_status: string | null;
  verification_level: string | null;
};

/**
 * Generate a base64-encoded nonce for CSP Level 3.
 */
function generateNonce(): string {
  return btoa(crypto.randomUUID());
}

/**
 * Build Content-Security-Policy header value with nonce.
 */
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com https://appleid.cdn-apple.com https://us.i.posthog.com https://us-assets.i.posthog.com https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://api.maptiler.com https://*.maptiler.com https://*.stripe.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://us.i.posthog.com https://us-assets.i.posthog.com https://api.maptiler.com https://api.stripe.com",
    "frame-src https://accounts.google.com https://appleid.apple.com https://js.stripe.com",
    "worker-src 'self' blob:",
    "form-action 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join("; ");
}

/**
 * Set security headers on the response.
 */
function setSecurityHeaders(response: NextResponse, nonce: string): void {
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set("x-nonce", nonce);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
}

function setResponseHeaders(
  response: NextResponse,
  nonce: string,
  correlationId: string,
): void {
  setSecurityHeaders(response, nonce);
  response.headers.set(CORRELATION_ID_HEADER, correlationId);
}

/**
 * Check if a pathname matches any route in the list.
 * Supports exact match and prefix match (e.g., /dashboard matches /dashboard/homebuyer).
 */
function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Build a redirect response with security headers applied.
 * Optionally appends search params (e.g. redirectTo).
 */
function redirectWithHeaders(
  path: string,
  nonce: string,
  request: NextRequest,
  searchParams?: Record<string, string>,
): NextResponse {
  const url = new URL(path, request.url);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  const response = NextResponse.redirect(url);
  setResponseHeaders(response, nonce, getCorrelationId(request.headers));
  return response;
}

export async function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const correlationId = getCorrelationId(request.headers);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CORRELATION_ID_HEADER, correlationId);
  const { pathname } = request.nextUrl;

  // ── Maintenance mode ────────────────────────────────────────────────────
  // Set NEXT_PUBLIC_MAINTENANCE_MODE=true in env to redirect all traffic to /maintenance.
  // Exempt: /maintenance itself, static files, and _next paths.
  if (
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" &&
    pathname !== "/maintenance" &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api/health")
  ) {
    return redirectWithHeaders("/maintenance", nonce, request);
  }

  // Create a response to modify headers
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // ── Referral attribution cookie ────────────────────────────────────────
  // Capture ref= param from any URL into a 90-day httpOnly cookie.
  // First-touch attribution: don't overwrite existing cookie.
  // ENG REVIEW 6A: httpOnly=true — server reads cookie in attribution API.
  const refParam = request.nextUrl.searchParams.get("ref");
  if (refParam && !request.cookies.get("britestate_ref")) {
    const sanitizedRef = refParam.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
    if (sanitizedRef.length >= 6) {
      response.cookies.set("britestate_ref", sanitizedRef, {
        httpOnly: true, // ENG REVIEW 6A: secure — read server-side only
        secure: process.env.NODE_ENV !== "development",
        sameSite: "lax",
        maxAge: 90 * 24 * 60 * 60, // 90 days
        path: "/",
      });
    }
  }

  // Skip auth checks if Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    setResponseHeaders(response, nonce, correlationId);
    return response;
  }

  // Create Supabase client with cookie access for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Use getUser() (not getSession) for secure auth verification
  // All DB operations wrapped in try/catch — on failure, redirect to /login as safe fallback
  let user;
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
  } catch (error) {
    captureException(error, {
      module: "kernel",
      feature: "middleware",
      operation: "auth.getUser",
      route: pathname,
      correlationId,
    });
    return redirectWithHeaders("/login", nonce, request, { redirectTo: pathname });
  }

  // ── JWT custom claims extraction ────────────────────────────────────────
  // When the `jwt_claims_middleware` feature flag is ON and the JWT token
  // contains role/plan/is_admin in app_metadata (injected by the PG auth hook),
  // skip DB round-trips entirely. Falls back to DB calls when:
  //   - flag is OFF (safe rollout)
  //   - claims are absent (old tokens before hook was deployed)
  const useJwtClaims = isFeatureEnabled("jwt_claims_middleware");
  const appMetadata = user?.app_metadata as {
    role?: string;
    plan?: string;
    is_admin?: boolean;
    admin_role?: string;
  } | undefined;
  const hasClaims = useJwtClaims && appMetadata?.role !== undefined && appMetadata?.role !== "";

  const isAuthenticated = !!user;
  const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);

  // ── MFA enforcement ────────────────────────────────────────────────────
  // If user has MFA factors enrolled, ensure they've completed aal2.
  // Skip for: auth routes, public routes, API routes, 2FA pages, verify-email.
  if (
    isAuthenticated &&
    !isPublicRoute &&
    !isAuthRoute &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/two-factor")
  ) {
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        const redirectParam = pathname !== "/dashboard"
          ? `?next=${encodeURIComponent(pathname)}`
          : "";
        return redirectWithHeaders(`/two-factor${redirectParam}`, nonce, request);
      }
    } catch {
      // MFA check failed — fail closed for admin routes, open for others
      console.warn("[middleware] MFA assurance check failed");
      if (pathname.startsWith("/admin")) {
        return redirectWithHeaders("/two-factor", nonce, request);
      }
      // Non-admin: fail open to avoid locking users out
    }
  }

  // Route protection logic
  if (!isAuthenticated && !isPublicRoute && !isAuthRoute) {
    // API routes: pass through — route handlers enforce their own auth
    if (pathname.startsWith("/api/")) {
      setResponseHeaders(response, nonce, correlationId);
      return response;
    }
    // Page routes: redirect to login
    return redirectWithHeaders("/login", nonce, request, { redirectTo: pathname });
  }

  // Allow authenticated users to access professional registration sub-routes
  const isProfessionalRegistration = pathname.startsWith("/register/role-select") || pathname.startsWith("/register/onboarding");

  if (isAuthenticated && isAuthRoute && !isProfessionalRegistration) {
    // Authenticated user trying to access auth route -> redirect to dashboard
    return redirectWithHeaders("/dashboard", nonce, request);
  }

  // ── Consolidated profile query ──────────────────────────────────────────
  // Fetch profile data once for both admin guard and role-route enforcement.
  // When JWT claims are available, skip the DB query entirely.
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = isAuthenticated && pathname.startsWith("/dashboard");

  // Only query the DB when we actually need profile data and don't have JWT claims.
  // Fetches provider_verification_status + verification_level for the verification
  // gate (Wave 1.2) so we avoid a second round-trip.
  let profileData: MiddlewareProfileData | null = null;

  if (isAuthenticated && !hasClaims && (isAdminRoute || isDashboardRoute)) {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("active_role, is_admin, admin_role, provider_verification_status, verification_level")
        .eq("id", user!.id)
        .single();

      if (error) {
        captureException(error, {
          module: "kernel",
          feature: "middleware",
          operation: "profiles.select",
          route: pathname,
          correlationId,
        });
        return redirectWithHeaders("/login", nonce, request, { redirectTo: pathname });
      }

      profileData = profile as MiddlewareProfileData | null;
    } catch (error) {
      captureException(error, {
        module: "kernel",
        feature: "middleware",
        operation: "profiles.select",
        route: pathname,
        correlationId,
      });
      return redirectWithHeaders("/login", nonce, request, { redirectTo: pathname });
    }
  }

  // ── Admin route guard ─────────────────────────────────────────────────
  if (isAdminRoute) {
    if (!isAuthenticated) {
      return redirectWithHeaders("/login", nonce, request, { redirectTo: pathname });
    }

    if (hasClaims) {
      if (appMetadata?.is_admin !== true) {
        return redirectWithHeaders("/forbidden", nonce, request);
      }
    } else {
      if (profileData?.is_admin !== true) {
        return redirectWithHeaders("/forbidden", nonce, request);
      }
    }
  }

  // ── Admin role permission gate ────────────────────────────────────
  if (isAdminRoute && pathname !== "/admin") {
    const adminRole = (hasClaims ? appMetadata?.admin_role : profileData?.admin_role) as AdminRole | undefined;
    // Deny access if admin_role is not set — never default to highest privilege
    if (!adminRole) {
      return redirectWithHeaders("/forbidden", nonce, request);
    }
    const role = adminRole;

    // Find the matching route permission
    const matchedRoute = Object.keys(ADMIN_ROUTE_PERMISSIONS)
      .filter((route) => pathname.startsWith(route))
      .sort((a, b) => b.length - a.length)[0]; // longest match wins

    if (matchedRoute) {
      const requiredPermission = ADMIN_ROUTE_PERMISSIONS[matchedRoute];
      if (!hasPermission(role, requiredPermission)) {
        return redirectWithHeaders("/forbidden", nonce, request);
      }
    }
  }

  // ── Role check + role-route enforcement ───────────────────────────────
  if (isDashboardRoute) {
    // Determine the user's actual role from JWT claims or DB
    const actualRole = hasClaims ? appMetadata?.role : profileData?.active_role;

    // No active_role → send to role selection
    if (!actualRole) {
      return redirectWithHeaders("/register/role-select", nonce, request);
    }

    // Extract the role segment from the URL: /dashboard/{roleSegment}/...
    const roleSegment = pathname.split("/")[2];
    if (roleSegment) {
      const expectedRole = ROUTE_TO_ROLE[roleSegment];

      // If the URL role segment maps to a known role and it doesn't match the user's actual role,
      // redirect to their correct dashboard
      if (expectedRole && expectedRole !== actualRole) {
        const correctRoute = ROLE_TO_ROUTE[actualRole as keyof typeof ROLE_TO_ROUTE];
        if (correctRoute) {
          return redirectWithHeaders(`/dashboard/${correctRoute}`, nonce, request);
        }
      }
    }

    // ── Professional verification gate ────────────────────────────────────
    // Providers and agents must be verified before accessing most dashboard
    // pages. Exempt: overview, billing, verification, and referrals pages.
    // JWT path: fail open — verification status isn't in JWT claims yet.
    const VERIFICATION_GATED_PREFIXES = [
      "/dashboard/agent",
      "/dashboard/provider",
    ] as const;

    const isVerificationGatedRoute = VERIFICATION_GATED_PREFIXES.some(
      (prefix) => pathname.startsWith(prefix),
    );

    if (isVerificationGatedRoute && !hasClaims) {
      const isVerificationExempt =
        VERIFICATION_GATED_PREFIXES.some((prefix) => pathname === prefix) || // overview exact match
        pathname.includes("/billing") ||
        pathname.includes("/verification") ||
        pathname.includes("/referrals");

      if (!isVerificationExempt) {
        const isProvider = pathname.startsWith("/dashboard/provider");
        const isAgent = pathname.startsWith("/dashboard/agent");

        const providerVerified =
          profileData?.provider_verification_status === "approved";
        const agentVerified =
          profileData?.verification_level === "professional";

        if (
          (isProvider && !providerVerified) ||
          (isAgent && !agentVerified)
        ) {
          const role = isProvider ? "provider" : "agent";
          return redirectWithHeaders(
            `/dashboard/${role}/verification`,
            nonce,
            request,
          );
        }
      }
    }
  }

  // Feature gate: subscription check for billing-gated routes
  // Routes under /dashboard/agent, /dashboard/landlord, /dashboard/provider
  // require an active subscription. Billing pages themselves are exempt.
  // Exempt: billing pages, main dashboard overview, referrals page
  const SUBSCRIPTION_GATED_PREFIXES = [
    "/dashboard/agent",
    "/dashboard/landlord",
    "/dashboard/provider",
  ];

  if (isAuthenticated) {
    const isGatedRoute = SUBSCRIPTION_GATED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    );
    const isBillingPage =
      pathname.includes("/billing") || pathname === "/dashboard";
    // Allow referrals page without subscription (needed to share referral links)
    const isReferralsPage = pathname.includes("/referrals");

    // Allow dashboard overview pages (exact match) without subscription
    const isDashboardOverview = SUBSCRIPTION_GATED_PREFIXES.some(
      (prefix) => pathname === prefix,
    );

    if (isGatedRoute && !isBillingPage && !isReferralsPage && !isDashboardOverview) {
      if (hasClaims) {
        const hasPlan = appMetadata?.plan && appMetadata.plan !== "";
        if (!hasPlan) {
          const roleMatch = pathname.match(/^\/dashboard\/(agent|landlord|provider)/);
          const role = roleMatch?.[1] ?? "agent";
          return redirectWithHeaders(
            `/dashboard/${role}/billing/checkout/subscription`,
            nonce,
            request,
          );
        }
      } else {
        try {
          const { data: subscription, error: subError } = await supabase
            .from("subscriptions")
            .select("status, plan_name")
            .eq("user_id", user!.id)
            .maybeSingle();

          // If table doesn't exist or query fails, allow access (fail open)
          // so dashboards remain usable while billing infra is being built
          if (!subError) {
            const sub = subscription as { status?: string; plan_name?: string } | null;
            const isActive = sub?.status === "active" || sub?.status === "trialing";

            if (!isActive) {
              const roleMatch = pathname.match(/^\/dashboard\/(agent|landlord|provider)/);
              const role = roleMatch?.[1] ?? "agent";
              return redirectWithHeaders(
                `/dashboard/${role}/billing/checkout/subscription`,
                nonce,
                request,
              );
            }
          } else {
            captureException(subError, {
              module: "kernel",
              feature: "middleware",
              operation: "subscriptions.select",
              route: pathname,
              correlationId,
            });
          }
        } catch (error) {
          // Subscription check failed (e.g. table missing) — fail open to
          // avoid blocking dashboard access during development
          captureException(error, {
            module: "kernel",
            feature: "middleware",
            operation: "subscriptions.select",
            route: pathname,
            correlationId,
          });
          console.warn("[middleware] Subscription check failed (passing through):", error);
        }
      }
    }
  }

  // Set security headers on passthrough response
  setResponseHeaders(response, nonce, correlationId);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static file extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};

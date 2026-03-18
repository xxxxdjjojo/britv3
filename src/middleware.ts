import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PUBLIC_ROUTES, AUTH_ROUTES } from "@/lib/constants";

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
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://accounts.google.com https://appleid.cdn-apple.com https://us.i.posthog.com https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://api.maptiler.com https://*.maptiler.com https://*.stripe.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://us.i.posthog.com https://api.maptiler.com https://api.stripe.com",
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

/**
 * Check if a pathname matches any route in the list.
 * Supports exact match and prefix match (e.g., /dashboard matches /dashboard/homebuyer).
 */
function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function middleware(request: NextRequest) {
  const nonce = generateNonce();
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
    const maintenanceUrl = new URL("/maintenance", request.url);
    const redirectResponse = NextResponse.redirect(maintenanceUrl);
    setSecurityHeaders(redirectResponse, nonce);
    return redirectResponse;
  }

  // Create a response to modify headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Skip auth checks if Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    setSecurityHeaders(response, nonce);
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
              headers: request.headers,
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
    console.error("[middleware] Auth check failed:", error);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    setSecurityHeaders(redirectResponse, nonce);
    return redirectResponse;
  }

  const isAuthenticated = !!user;
  const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);

  // Route protection logic
  if (!isAuthenticated && !isPublicRoute && !isAuthRoute) {
    // API routes: pass through — route handlers enforce their own auth
    if (pathname.startsWith("/api/")) {
      setSecurityHeaders(response, nonce);
      return response;
    }
    // Page routes: redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    setSecurityHeaders(redirectResponse, nonce);
    return redirectResponse;
  }

  // Allow authenticated users to access professional registration sub-routes
  const isProfessionalRegistration = pathname.startsWith("/register/role-select") || pathname.startsWith("/register/onboarding");

  if (isAuthenticated && isAuthRoute && !isProfessionalRegistration) {
    // Authenticated user trying to access auth route -> redirect to dashboard
    const dashboardUrl = new URL("/dashboard", request.url);
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    setSecurityHeaders(redirectResponse, nonce);
    return redirectResponse;
  }

  // Admin route guard: require authentication and is_admin flag on profile
  const isAdminRoute = pathname.startsWith("/admin");
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      setSecurityHeaders(redirectResponse, nonce);
      return redirectResponse;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user!.id)
        .single();

      if (profile?.is_admin !== true) {
        const forbiddenUrl = new URL("/forbidden", request.url);
        const redirectResponse = NextResponse.redirect(forbiddenUrl);
        setSecurityHeaders(redirectResponse, nonce);
        return redirectResponse;
      }
    } catch (error) {
      console.error("[middleware] Admin guard check failed:", error);
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      setSecurityHeaders(redirectResponse, nonce);
      return redirectResponse;
    }
  }

  // Role check: if user accesses dashboard with no active_role, redirect to role selection
  if (isAuthenticated && pathname.startsWith("/dashboard")) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_role")
        .eq("id", user!.id)
        .single();

      if (profile && !profile.active_role) {
        const roleSelectUrl = new URL("/register/role-select", request.url);
        const redirectResponse = NextResponse.redirect(roleSelectUrl);
        setSecurityHeaders(redirectResponse, nonce);
        return redirectResponse;
      }
    } catch (error) {
      console.error("[middleware] Profile role check failed:", error);
      const loginUrl = new URL("/login", request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      setSecurityHeaders(redirectResponse, nonce);
      return redirectResponse;
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

    if (isGatedRoute && !isBillingPage && !isReferralsPage) {
      try {
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("status, plan_name")
          .eq("user_id", user!.id)
          .maybeSingle();

        const sub = subscription as { status?: string; plan_name?: string } | null;
        const isActive = sub?.status === "active" || sub?.status === "trialing";

        if (!isActive) {
          // Determine the role for the billing redirect
          const roleMatch = pathname.match(/^\/dashboard\/(agent|landlord|provider)/);
          const role = roleMatch?.[1] ?? "agent";
          const billingUrl = new URL(`/dashboard/${role}/billing/checkout/subscription`, request.url);
          const redirectResponse = NextResponse.redirect(billingUrl);
          setSecurityHeaders(redirectResponse, nonce);
          return redirectResponse;
        }
      } catch (error) {
        console.error("[middleware] Subscription check failed:", error);
        const loginUrl = new URL("/login", request.url);
        const redirectResponse = NextResponse.redirect(loginUrl);
        setSecurityHeaders(redirectResponse, nonce);
        return redirectResponse;
      }
    }
  }

  // Set security headers on passthrough response
  setSecurityHeaders(response, nonce);
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
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

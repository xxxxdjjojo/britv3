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
    `script-src 'self' 'nonce-${nonce}' https://accounts.google.com https://appleid.cdn-apple.com https://us.i.posthog.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://us.i.posthog.com",
    "frame-src https://accounts.google.com https://appleid.apple.com",
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);

  // Route protection logic
  if (!isAuthenticated && !isPublicRoute && !isAuthRoute) {
    // Unauthenticated user trying to access protected route -> redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    setSecurityHeaders(redirectResponse, nonce);
    return redirectResponse;
  }

  if (isAuthenticated && isAuthRoute) {
    // Authenticated user trying to access auth route -> redirect to dashboard
    const dashboardUrl = new URL("/dashboard", request.url);
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    setSecurityHeaders(redirectResponse, nonce);
    return redirectResponse;
  }

  // Admin route guard: require is_admin flag on profile
  const isAdminRoute = pathname.startsWith("/admin");
  if (isAdminRoute && isAuthenticated) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user!.id)
      .single();

    if (!profile?.is_admin) {
      const homeUrl = new URL("/", request.url);
      const redirectResponse = NextResponse.redirect(homeUrl);
      setSecurityHeaders(redirectResponse, nonce);
      return redirectResponse;
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

import { expect, type ConsoleMessage, type Page } from "@playwright/test";

/**
 * Shared smoke-test helpers for per-role static-route coverage.
 *
 * These mirror the inline helpers in `dashboard-navigation.spec.ts` so the
 * route-smoke spec can navigate a URL and assert it renders without an app
 * error. They are kept in `fixtures/` so multiple specs can reuse them; the
 * nav spec is intentionally left untouched.
 */

/** Regex matching the standard Next.js / app error surfaces. */
const APP_ERROR_TEXT =
  /Page not found|This page could not be found|Application error|Something went wrong/i;

/**
 * Assert the page body shows none of the known app-error surfaces (404, crash,
 * error boundary).
 */
export async function expectNoAppError(page: Page): Promise<void> {
  await expect(page.locator("body")).not.toContainText(APP_ERROR_TEXT);
}

/**
 * Navigate to `href` and assert it renders: HTTP status < 400, no app-error
 * text, and a visible heading. Mirrors the nav spec's destination check.
 */
export async function expectDashboardDestinationToRender(
  page: Page,
  href: string,
): Promise<void> {
  const response = await page.goto(href, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `${href} returned an error status`).toBeLessThan(400);
  await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => undefined);
  await expectNoAppError(page);
  await expect(
    page.getByRole("heading").first(),
    `${href} should render a visible heading`,
  ).toBeVisible();
}

/**
 * Allowlist of console-error substrings that are known-noisy and unrelated to a
 * route genuinely failing. Keep this TIGHT — broadening it can mask real bugs.
 *
 * - favicon / manifest 404s: static-asset noise, not a page failure.
 * - ResizeObserver loop: benign browser warning emitted by many UI libs.
 * - Third-party SDKs (PostHog / Sentry / Stripe): network errors from external
 *   services, not the route's own failure. These dominate as opaque
 *   "Failed to load resource: 404/401" messages whose URL only appears in the
 *   console message LOCATION, so the allowlist is matched against both the
 *   message text and its source URL.
 */
const CONSOLE_ERROR_ALLOWLIST: readonly RegExp[] = [
  /favicon\.ico/i,
  /manifest\.json/i,
  /ResizeObserver loop/i,
  /posthog/i,
  /sentry/i,
  /stripe/i,
];

/**
 * Narrowly-scoped allowlist: a `TypeError: Failed to fetch` whose stack
 * originates in the `@supabase/auth-js` session/token client. Under parallel
 * load against hosted Supabase, the auth client's background session refresh
 * intermittently aborts and surfaces this on otherwise-healthy pages. Scoped to
 * BOTH tokens (the fetch failure AND the supabase-auth-js source) so it cannot
 * mask an unrelated `Failed to fetch` from app code.
 */
function isTransientSupabaseAuthFetch(text: string): boolean {
  return /Failed to fetch/i.test(text) && /supabase[_-]auth-js/i.test(text);
}

function isAllowedConsoleError(text: string, url: string): boolean {
  if (isTransientSupabaseAuthFetch(text)) return true;
  return CONSOLE_ERROR_ALLOWLIST.some(
    (pattern) => pattern.test(text) || pattern.test(url),
  );
}

export type ConsoleErrorCollector = {
  /** Console errors captured so far that are NOT on the allowlist. */
  readonly errors: string[];
  /** Reset the captured list (call before navigating to each route). */
  reset(): void;
};

/**
 * Attach a console listener to the page that records non-allowlisted console
 * errors. Returns a collector whose `errors` array can be asserted empty after
 * each navigation, and `reset()` to clear between routes.
 */
export function captureConsoleErrors(page: Page): ConsoleErrorCollector {
  const errors: string[] = [];

  page.on("console", (message: ConsoleMessage) => {
    if (message.type() !== "error") return;
    const text = message.text();
    const url = message.location().url;
    if (isAllowedConsoleError(text, url)) return;
    errors.push(url ? `${text} (${url})` : text);
  });

  return {
    errors,
    reset() {
      errors.length = 0;
    },
  };
}

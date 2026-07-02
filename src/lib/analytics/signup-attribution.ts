/**
 * First-touch signup attribution.
 *
 * On a visitor's first page view we snapshot where they came from (UTM params,
 * referrer, landing path). At signup time `getSignupSource()` collapses that
 * snapshot into a compact `signup_source` string that travels in the Supabase
 * signup metadata, so cohorts can be attributed back to the first-touch tool,
 * pledge, or campaign.
 *
 * Client-safe: every entry point is SSR-guarded and never throws (localStorage
 * can be unavailable in private browsing / blocked-storage contexts).
 */

const FIRST_TOUCH_KEY = "truedeed_first_touch";

type FirstTouch = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string;
  captured_at: string;
};

export function captureFirstTouch(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(FIRST_TOUCH_KEY) !== null) return;

    const params = new URLSearchParams(window.location.search);
    const firstTouch: FirstTouch = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      referrer: document.referrer || null,
      landing_path: window.location.pathname,
      captured_at: new Date().toISOString(),
    };
    window.localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(firstTouch));
  } catch {
    // Attribution must never break the app
  }
}

/**
 * Derives a compact `signup_source` string from the stored first touch:
 * - `utm:<source>/<medium>` when UTM params were present (e.g. "utm:google/cpc")
 * - `ref:<referrer-host>` when arriving via an external referrer (e.g. "ref:reddit.com")
 * - `direct:<landing_path>` otherwise (e.g. "direct:/pledges")
 * Returns null when no first touch has been captured.
 */
export function getSignupSource(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FIRST_TOUCH_KEY);
    if (!raw) return null;

    const firstTouch = JSON.parse(raw) as Partial<FirstTouch>;
    if (firstTouch.utm_source) {
      return `utm:${firstTouch.utm_source}/${firstTouch.utm_medium ?? "none"}`;
    }
    if (firstTouch.referrer) {
      const host = referrerHost(firstTouch.referrer);
      if (host) return `ref:${host}`;
    }
    return `direct:${firstTouch.landing_path ?? "/"}`;
  } catch {
    return null;
  }
}

function referrerHost(referrer: string): string | null {
  try {
    const url = new URL(referrer);
    // Same-site referrers are not an external source
    if (url.host === window.location.host) return null;
    return url.hostname;
  } catch {
    return null;
  }
}

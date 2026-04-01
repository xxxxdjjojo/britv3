import posthog from "posthog-js";

export function initPostHog(): void {
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    disable_surveys: true,
  });
}

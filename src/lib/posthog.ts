import posthog from "posthog-js";

export function initPostHog(): void {
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    // Don't load remote feature-flag config / session-replay / surveys on init.
    // These endpoints 401/404 with the soft-launch key and the extra main-thread
    // work hurts Lighthouse TBT/Speed Index. Pageview/event capture still works.
    advanced_disable_feature_flags: true,
    advanced_disable_feature_flags_on_first_load: true,
    disable_session_recording: true,
    disable_surveys: true,
    disable_external_dependency_loading: true,
  });
}

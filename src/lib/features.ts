const KNOWN_FEATURES = ["ai_descriptions", "push_notifications", "offline_mode", "jwt_claims_middleware", "search_live_data", "local_area_intelligence", "search_rental_filters", "search_mock_data"] as const;

type KnownFeature = (typeof KNOWN_FEATURES)[number];

/**
 * Resolve every known flag's raw env value via a STATIC
 * `process.env.NEXT_PUBLIC_ENABLE_*` reference.
 *
 * Why static (not the old `process.env[computedKey]`): Next.js inlines
 * NEXT_PUBLIC_ vars at build time ONLY where they are referenced statically.
 * A dynamic, computed-key read resolves to `undefined` in the production server
 * bundle — so on Vercel every flag read returned false regardless of the
 * configured value (it only "worked" in dev/Vitest, which expose a real
 * `process.env`). That shipped a live bug: /search returned 0 results because
 * `search_mock_data` never read as "true" in prod. Keep these references
 * static and add a matching line for any new flag.
 *
 * Built at call time so `vi.stubEnv` continues to work in unit tests.
 */
function flagEnv(): Record<KnownFeature, string | undefined> {
  return {
    ai_descriptions: process.env.NEXT_PUBLIC_ENABLE_AI_DESCRIPTIONS,
    push_notifications: process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS,
    offline_mode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE,
    jwt_claims_middleware: process.env.NEXT_PUBLIC_ENABLE_JWT_CLAIMS_MIDDLEWARE,
    search_live_data: process.env.NEXT_PUBLIC_ENABLE_SEARCH_LIVE_DATA,
    local_area_intelligence: process.env.NEXT_PUBLIC_ENABLE_LOCAL_AREA_INTELLIGENCE,
    search_rental_filters: process.env.NEXT_PUBLIC_ENABLE_SEARCH_RENTAL_FILTERS,
    search_mock_data: process.env.NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA,
  };
}

/**
 * Check if a feature flag is enabled via environment variables.
 * Reads the static `NEXT_PUBLIC_ENABLE_{NAME}` reference and returns true only
 * if the value is exactly "true". Unknown flags are always false.
 *
 * Upgrade path: Replace env var reads with PostHog feature flag API calls
 * (posthog.isFeatureEnabled(name)) when remote feature flag management is needed.
 */
export function isFeatureEnabled(name: string): boolean {
  return flagEnv()[name.toLowerCase() as KnownFeature] === "true";
}

/**
 * Returns current values of all known feature flags.
 */
export function features(): Record<KnownFeature, boolean> {
  const env = flagEnv();
  return Object.fromEntries(
    KNOWN_FEATURES.map((name) => [name, env[name] === "true"]),
  ) as Record<KnownFeature, boolean>;
}

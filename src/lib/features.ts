const KNOWN_FEATURES = ["ai_descriptions", "push_notifications", "offline_mode", "jwt_claims_middleware", "search_live_data", "local_area_intelligence"] as const;

type KnownFeature = (typeof KNOWN_FEATURES)[number];

/**
 * Check if a feature flag is enabled via environment variables.
 * Reads `NEXT_PUBLIC_ENABLE_{NAME}` (uppercased) and returns true only if the value is exactly "true".
 *
 * Upgrade path: Replace env var reads with PostHog feature flag API calls
 * (posthog.isFeatureEnabled(name)) when remote feature flag management is needed.
 */
export function isFeatureEnabled(name: string): boolean {
  const envKey = `NEXT_PUBLIC_ENABLE_${name.toUpperCase()}`;
  return process.env[envKey] === "true";
}

/**
 * Returns current values of all known feature flags.
 */
export function features(): Record<KnownFeature, boolean> {
  return Object.fromEntries(
    KNOWN_FEATURES.map((name) => [name, isFeatureEnabled(name)]),
  ) as Record<KnownFeature, boolean>;
}

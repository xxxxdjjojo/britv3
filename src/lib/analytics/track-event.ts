import posthog from "posthog-js";

type EventProps = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: string, properties?: EventProps): void {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(name, properties);
  } catch {
    // Analytics must never break the app
  }
}

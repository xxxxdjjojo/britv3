type PostHogServerEvent = Readonly<{
  event: string;
  properties?: Record<string, unknown>;
  distinctId?: string;
}>;

export type PostHogServerClient = Readonly<{
  capture?: (event: PostHogServerEvent) => void;
}>;

export const posthogServer: PostHogServerClient | null = null;

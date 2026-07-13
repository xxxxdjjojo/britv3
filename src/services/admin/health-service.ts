import { unstable_cache } from "next/cache";

export type ServiceStatus = {
  name: string;
  status: "up" | "down" | "degraded";
  latencyMs: number | null;
  error?: string;
};

export async function pingSupabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return { name: "Supabase DB", status: "down", latencyMs: null, error: "Service not configured" };
    // GoTrue's purpose-built health endpoint. The PostgREST root (/rest/v1/)
    // is NOT usable here: on this project it responds 401 "Only the
    // service_role API key can be used for this endpoint" to the anon key,
    // which made this probe report "degraded" forever.
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    return { name: "Supabase DB", status: res.ok ? "up" : "degraded", latencyMs };
  } catch (e) {
    return { name: "Supabase DB", status: "down", latencyMs: Date.now() - start, error: e instanceof Error ? e.message : "Unreachable" };
  }
}

export async function pingStripe(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch("https://status.stripe.com/api/v2/status.json", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { name: "Stripe", status: "down", latencyMs };
    const body = (await res.json()) as { status?: { indicator?: string } };
    const indicator = body?.status?.indicator;
    const status = indicator === "none" ? "up" : indicator === "minor" ? "degraded" : "down";
    return { name: "Stripe", status, latencyMs };
  } catch (e) {
    return { name: "Stripe", status: "down", latencyMs: Date.now() - start, error: e instanceof Error ? e.message : "Unreachable" };
  }
}

export async function pingResend(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Resend has no public status endpoint we can query without auth — use domain reachability
    const res = await fetch("https://resend.com", {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    return { name: "Resend", status: res.ok || res.status < 500 ? "up" : "down", latencyMs };
  } catch (e) {
    return { name: "Resend", status: "down", latencyMs: Date.now() - start, error: e instanceof Error ? e.message : "Unreachable" };
  }
}

export async function pingPostHog(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch("https://status.posthog.com/api/v2/status.json", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { name: "PostHog", status: "down", latencyMs };
    const body = (await res.json()) as { status?: { indicator?: string } };
    const indicator = body?.status?.indicator;
    const status = indicator === "none" ? "up" : indicator === "minor" ? "degraded" : "down";
    return { name: "PostHog", status, latencyMs };
  } catch (e) {
    return { name: "PostHog", status: "down", latencyMs: Date.now() - start, error: e instanceof Error ? e.message : "Unreachable" };
  }
}

export const getHealthStatus = unstable_cache(
  async (): Promise<ServiceStatus[]> => {
    return Promise.all([pingSupabase(), pingStripe(), pingResend(), pingPostHog()]);
  },
  ["health-status"],
  { revalidate: 30 },
);

export async function pingAnthropic(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch("https://status.anthropic.com/api/v2/status.json", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { name: "Anthropic", status: "down", latencyMs };
    const body = (await res.json()) as { status?: { indicator?: string } };
    const indicator = body?.status?.indicator;
    const status = indicator === "none" ? "up" : indicator === "minor" ? "degraded" : "down";
    return { name: "Anthropic", status, latencyMs };
  } catch (e) {
    return { name: "Anthropic", status: "down", latencyMs: Date.now() - start, error: e instanceof Error ? e.message : "Unreachable" };
  }
}

export async function pingRedis(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      return { name: "Redis", status: "degraded", latencyMs: null, error: "Not configured" };
    }
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    return { name: "Redis", status: res.ok ? "up" : "down", latencyMs };
  } catch (e) {
    return { name: "Redis", status: "down", latencyMs: Date.now() - start, error: e instanceof Error ? e.message : "Unreachable" };
  }
}

/**
 * Full dependency sweep for the privileged /admin/system-health panel — the
 * public getHealthStatus stays a lean four-service check. Not cached: this is
 * an on-demand admin diagnostic.
 */
export async function getDeepHealthStatus(): Promise<ServiceStatus[]> {
  return Promise.all([
    pingSupabase(),
    pingStripe(),
    pingResend(),
    pingPostHog(),
    pingAnthropic(),
    pingRedis(),
  ]);
}

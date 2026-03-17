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
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}`,
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

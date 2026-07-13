import { createClient } from "@/lib/supabase/server";
import {
  type ServiceStatus,
  getHealthStatus,
} from "@/services/admin/health-service";
import {
  MIN_UPTIME_PROBES,
  SERIES_WINDOW_DAYS,
  buildUptime,
  type UptimeSummary,
} from "@/services/metrics/platform-metrics-service";

/**
 * Public status page data (src/app/(main)/status).
 *
 * This module is the security boundary for the status page: it maps the
 * internal ServiceStatus (which may carry an `error` string and a raw vendor
 * name) down to a public-safe shape — customer-facing label + coarse state —
 * and NOTHING else. The `error`, raw latency, and hostnames never cross this
 * line. Uptime history is read from the same publicly-readable `uptime_checks`
 * table that powers /metrics (reusing buildUptime for one source of truth).
 */

export type ComponentState = "operational" | "degraded" | "down";
export type OverallState = "operational" | "degraded" | "outage";

export type PublicComponent = Readonly<{
  key: string;
  label: string;
  state: ComponentState;
}>;

export type LatestProbe = Readonly<{
  ok: boolean;
  checkedAt: string;
  latencyMs: number | null;
}>;

export type StatusPageData = Readonly<{
  overall: OverallState;
  components: readonly PublicComponent[];
  uptime: UptimeSummary;
  windowDays: number;
  minProbes: number;
  latestProbe: LatestProbe | null;
  generatedAt: string;
}>;

/** Internal vendor name → customer-facing label + stable key. */
const COMPONENT_MAP: Record<string, { key: string; label: string }> = {
  "Supabase DB": { key: "core", label: "Website & database" },
  Stripe: { key: "payments", label: "Payments" },
  Resend: { key: "email", label: "Email" },
  PostHog: { key: "analytics", label: "Analytics" },
};

const STATE_MAP: Record<ServiceStatus["status"], ComponentState> = {
  up: "operational",
  degraded: "degraded",
  down: "down",
};

/** Map an internal ServiceStatus to a public-safe component. Drops error/latency/hostname. */
export function mapComponent(status: ServiceStatus): PublicComponent {
  const mapped = COMPONENT_MAP[status.name] ?? { key: "other", label: "Other service" };
  return { key: mapped.key, label: mapped.label, state: STATE_MAP[status.status] };
}

/** Roll components + the external probe into one customer-facing verdict. */
export function overallState(
  components: readonly PublicComponent[],
  latestProbeOk: boolean | null,
): OverallState {
  const anyDown = components.some((c) => c.state === "down") || latestProbeOk === false;
  if (anyDown) return "outage";
  if (components.some((c) => c.state === "degraded")) return "degraded";
  return "operational";
}

type UptimeRead = { uptime: UptimeSummary; latestProbe: LatestProbe | null };

/**
 * Read trailing-window uptime from uptime_checks. Resilient by design: a status
 * page must not itself crash when the DB is unhappy, so a query failure returns
 * gated/empty uptime rather than throwing.
 */
async function readUptime(): Promise<UptimeRead> {
  try {
    const supabase = await createClient();
    const windowStart = new Date(
      Date.now() - SERIES_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [totalRes, okRes, latestRes] = await Promise.all([
      supabase
        .from("uptime_checks")
        .select("id", { count: "exact", head: true })
        .gte("checked_at", windowStart),
      supabase
        .from("uptime_checks")
        .select("id", { count: "exact", head: true })
        .gte("checked_at", windowStart)
        .eq("ok", true),
      supabase
        .from("uptime_checks")
        .select("ok, checked_at, latency_ms")
        .order("checked_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const total = totalRes.count ?? 0;
    const ok = okRes.count ?? 0;
    const latest = latestRes.data;
    return {
      uptime: buildUptime(ok, total),
      latestProbe: latest
        ? { ok: latest.ok, checkedAt: latest.checked_at, latencyMs: latest.latency_ms }
        : null,
    };
  } catch {
    return { uptime: buildUptime(0, 0), latestProbe: null };
  }
}

export async function getStatusPageData(): Promise<StatusPageData> {
  const [health, uptimeRead] = await Promise.all([getHealthStatus(), readUptime()]);
  const components = health.map(mapComponent);
  return {
    overall: overallState(components, uptimeRead.latestProbe?.ok ?? null),
    components,
    uptime: uptimeRead.uptime,
    windowDays: SERIES_WINDOW_DAYS,
    minProbes: MIN_UPTIME_PROBES,
    latestProbe: uptimeRead.latestProbe,
    generatedAt: new Date().toISOString(),
  };
}

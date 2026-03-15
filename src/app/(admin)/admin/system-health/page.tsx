import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  CreditCard,
  Mail,
  BarChart3,
} from "lucide-react";

type ServiceStatus = {
  name: string;
  status: "up" | "down" | "degraded";
  latencyMs: number | null;
  error?: string;
};

async function pingSupabase(): Promise<ServiceStatus> {
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

async function pingStripe(): Promise<ServiceStatus> {
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

async function pingResend(): Promise<ServiceStatus> {
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

async function pingPostHog(): Promise<ServiceStatus> {
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

function StatusIcon({ status }: { status: ServiceStatus["status"] }) {
  if (status === "up") return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (status === "degraded") return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

const SERVICE_ICONS = {
  "Supabase DB": Database,
  Stripe: CreditCard,
  Resend: Mail,
  PostHog: BarChart3,
} as const;

function ServiceCard({ service }: { service: ServiceStatus }) {
  const Icon = SERVICE_ICONS[service.name as keyof typeof SERVICE_ICONS] ?? Database;
  const statusColor =
    service.status === "up"
      ? "text-green-600"
      : service.status === "degraded"
        ? "text-yellow-600"
        : "text-red-600";
  const statusBg =
    service.status === "up"
      ? "bg-green-50 border-green-200"
      : service.status === "degraded"
        ? "bg-yellow-50 border-yellow-200"
        : "bg-red-50 border-red-200";

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${statusBg}`}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-neutral-500" />
        <div>
          <p className="text-sm font-medium text-neutral-900">{service.name}</p>
          {service.error && (
            <p className="text-xs text-neutral-500 truncate max-w-xs">{service.error}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {service.latencyMs !== null && (
          <span className="text-sm text-neutral-500">{service.latencyMs}ms</span>
        )}
        <div className="flex items-center gap-1.5">
          <StatusIcon status={service.status} />
          <span className={`text-sm font-medium capitalize ${statusColor}`}>
            {service.status}
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function SystemHealthPage() {
  const [supabase, stripe, resend, posthog] = await Promise.all([
    pingSupabase(),
    pingStripe(),
    pingResend(),
    pingPostHog(),
  ]);

  const services = [supabase, stripe, resend, posthog];
  const allUp = services.every((s) => s.status === "up");
  const anyDown = services.some((s) => s.status === "down");
  const overallStatus = allUp ? "All systems operational" : anyDown ? "Some services degraded" : "Minor issues detected";
  const overallColor = allUp ? "text-green-600" : anyDown ? "text-red-600" : "text-yellow-600";

  return (
    <div>
      <AdminPageHeader
        title="System Health"
        description="Real-time status checks for all external services."
      />

      <div className="mb-6 p-4 rounded-lg border border-neutral-200 bg-white">
        <p className={`text-sm font-semibold ${overallColor}`}>{overallStatus}</p>
        <p className="text-xs text-neutral-400 mt-0.5">
          Checked at {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <ServiceCard key={service.name} service={service} />
        ))}
      </div>

      <p className="mt-6 text-xs text-neutral-400 text-center">
        This page performs live pings on every load. Refresh to re-check.
      </p>
    </div>
  );
}

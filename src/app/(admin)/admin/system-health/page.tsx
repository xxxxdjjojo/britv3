import { Suspense } from "react";
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
import type { ServiceStatus } from "@/services/admin/health-service";
import {
  pingSupabase,
  pingStripe,
  pingResend,
  pingPostHog,
} from "@/services/admin/health-service";
import { Skeleton } from "@/components/ui/skeleton";

function StatusIcon({ status }: { status: ServiceStatus["status"] }) {
  if (status === "up") return <CheckCircle className="h-5 w-5 text-success dark:text-success" />;
  if (status === "degraded") return <AlertCircle className="h-5 w-5 text-warning dark:text-warning" />;
  return <XCircle className="h-5 w-5 text-error dark:text-error" />;
}

const SERVICE_ICONS = {
  "Supabase DB": Database,
  Stripe: CreditCard,
  Resend: Mail,
  PostHog: BarChart3,
} as const;

function ServiceCard({ service }: { service: ServiceStatus }) {
  const Icon = SERVICE_ICONS[service.name as keyof typeof SERVICE_ICONS] ?? Database;
  const statusPill =
    service.status === "up"
      ? "bg-success-light text-success dark:bg-success/20 dark:text-success"
      : service.status === "degraded"
        ? "bg-warning-light text-warning dark:bg-warning/20 dark:text-warning"
        : "bg-error-light text-error dark:bg-error/20 dark:text-error";

  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-[0_20px_50px_rgba(26,28,28,0.03)]">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-brand-primary-lighter p-2.5">
          <Icon className="h-4 w-4 text-brand-primary" />
        </div>
        <div>
          <p className="font-body text-sm font-semibold text-brand-primary-dark">{service.name}</p>
          {service.error && (
            <p className="font-body text-xs text-neutral-500 truncate max-w-xs">{service.error}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {service.latencyMs !== null && (
          <span className="font-body text-sm font-medium text-neutral-400">{service.latencyMs}ms</span>
        )}
        <div className="flex items-center gap-2">
          <StatusIcon status={service.status} />
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-semibold capitalize ${statusPill}`}>
            {service.status}
          </span>
        </div>
      </div>
    </div>
  );
}


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
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

  return (
    <div>
      <AdminPageHeader
        title="System Health"
        label="Real-time Performance"
        description="Real-time status checks for all external services."
      />

      <div className="mb-6 rounded-xl bg-brand-primary-dark p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <span className={`flex h-2.5 w-2.5 rounded-full ${allUp ? "bg-success" : anyDown ? "bg-error" : "bg-warning"} animate-pulse`} />
          <p className="font-heading text-base font-bold">{overallStatus}</p>
        </div>
        <p className="font-body text-xs text-brand-primary-lighter/60">
          Checked at {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <ServiceCard key={service.name} service={service} />
        ))}
      </div>

      <p className="mt-6 font-body text-xs text-neutral-400 text-center">
        This page performs live pings on every load. Refresh to re-check.
      </p>
    </div>
  );
}

export default function SystemHealthPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

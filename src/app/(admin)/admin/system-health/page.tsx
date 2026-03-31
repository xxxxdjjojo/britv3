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
  if (status === "up") return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
  if (status === "degraded") return <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
  return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
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
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      : service.status === "degraded"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";

  return (
    <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-brand-primary-lighter p-2 dark:bg-brand-primary/20">
          <Icon className="h-4 w-4 text-brand-primary" />
        </div>
        <div>
          <p className="font-body text-sm font-medium text-foreground">{service.name}</p>
          {service.error && (
            <p className="font-body text-xs text-neutral-500 truncate max-w-xs">{service.error}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {service.latencyMs !== null && (
          <span className="font-body text-sm text-neutral-500">{service.latencyMs}ms</span>
        )}
        <div className="flex items-center gap-1.5">
          <StatusIcon status={service.status} />
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium capitalize ${statusPill}`}>
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
  const overallColor = allUp ? "text-green-700 dark:text-green-400" : anyDown ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400";

  return (
    <div>
      <AdminPageHeader
        title="System Health"
        description="Real-time status checks for all external services."
      />

      <div className="mb-6 rounded-xl bg-card p-4 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        <p className={`font-body text-sm font-semibold ${overallColor}`}>{overallStatus}</p>
        <p className="font-body text-xs text-neutral-400 mt-0.5">
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

import { Suspense } from "react";
import Link from "next/link";
import { Building2, Calendar, Percent, PoundSterling, Wrench, Plus, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioKPIs, getHealthScore } from "@/services/landlord/portfolio-service";
import { getComplianceSummary } from "@/services/landlord/document-service";
import { getRentCollection } from "@/services/landlord/financial-service";
import { scoreActionItems } from "@/services/landlord/action-items-service";
import { isAllClear } from "@/lib/all-clear-check";
import { getDaysUntil } from "@/lib/date-utils";
import { KpiCard } from "@/components/landlord/KpiCard";
import { HealthScoreCard } from "@/components/landlord/HealthScoreCard";
import { ComplianceAlertBanner } from "@/components/landlord/ComplianceAlertBanner";
import { AllClearBanner } from "@/components/landlord/AllClearBanner";
import { ActionItemsCard } from "@/components/landlord/ActionItemsCard";
import { KeyDatesTicker } from "@/components/landlord/KeyDatesTicker";
import type { KeyDate } from "@/components/landlord/KeyDatesTicker";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardAnalytics } from "@/components/landlord/DashboardAnalytics";

export const metadata = {
  title: "Dashboard | Landlord | Britestate",
};

async function DashboardContent() {
  const supabase = await createClient();

  const [kpis, complianceDocs, healthScore, rentGroups, keyDatesResult] = await Promise.all([
    getPortfolioKPIs(supabase),
    getComplianceSummary(supabase),
    getHealthScore(supabase),
    getRentCollection(supabase),
    supabase.rpc("get_key_dates", { p_days_ahead: 60 }),
  ]);

  // Key dates from RPC
  const keyDates: KeyDate[] = (keyDatesResult.data ?? []) as KeyDate[];

  // Filter to only expired or expiring_soon documents
  const alerts = complianceDocs.filter(
    (doc) => doc.status === "expired" || doc.status === "expiring_soon",
  );

  // Show max 3 banners
  const alertsToShow = alerts.slice(0, 3);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute action items
  const overdueRents = rentGroups.overdue.map((r) => ({
    tenantName: r.tenant_name,
    propertyAddress: r.property_address,
    amount: r.entry.amount,
    daysDue: Math.abs(getDaysUntil(r.entry.entry_date)),
    propertyId: r.entry.property_id,
  }));

  const expiringCompliance = complianceDocs
    .filter((d) => d.status === "expired" || d.status === "expiring_soon")
    .map((d) => ({
      category: d.category,
      propertyAddress: `${d.property.address_line_1}, ${d.property.city}`,
      daysUntilExpiry: getDaysUntil(d.expiry_date),
      propertyId: "",
    }));

  const actionItems = scoreActionItems({
    overdueRents,
    expiringCompliance,
    endingTenancies: [],
    openMaintenance: [],
  });

  const allClear = isAllClear({
    totalOverdueRent: rentGroups.overdue.length,
    expiredCompliance: complianceDocs.filter((d) => d.status === "expired").length,
    expiringSoonCompliance: complianceDocs.filter((d) => d.status === "expiring_soon").length,
    openMaintenance: kpis.open_maintenance,
    totalProperties: kpis.total_properties,
  });

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Welcome Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-primary p-8 text-white shadow-lg md:p-10">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-1 text-sm font-medium text-white/70 uppercase tracking-widest">Landlord Dashboard</p>
          <h2 className="font-heading mb-3 text-3xl font-bold tracking-tight md:text-4xl">
            Portfolio Overview
          </h2>
          <p className="mb-7 text-base leading-relaxed text-white/80">
            {kpis.total_properties === 0
              ? "Get started by adding your first rental property."
              : `Managing ${kpis.total_properties} propert${kpis.total_properties === 1 ? "y" : "ies"}.${
                  kpis.compliance_alerts > 0
                    ? ` You have ${kpis.compliance_alerts} compliance item${kpis.compliance_alerts > 1 ? "s" : ""} requiring attention.`
                    : " All compliance certificates are up to date."
                }`}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/landlord/properties/add"
              aria-label="Add a new property"
              className="flex items-center gap-2 rounded-xl bg-white/15 border border-white/25 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <Plus className="size-4" />
              Add Property
            </Link>
            <Link
              href="/dashboard/landlord/compliance"
              aria-label="View compliance status"
              className="flex items-center gap-2 rounded-xl bg-white/15 border border-white/25 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <ShieldCheck className="size-4" />
              Compliance
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-[0.07]">
          <Building2 className="h-full w-full translate-x-1/4 -translate-y-1/4" />
        </div>
      </section>

      {/* KPI Cards */}
      <section aria-label="Key performance indicators">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Total Properties"
            value={kpis.total_properties}
            icon={Building2}
          />
          <KpiCard
            title="Occupancy Rate"
            value={`${kpis.occupancy_rate.toFixed(1)}%`}
            icon={Percent}
            trend={
              kpis.occupancy_rate >= 90
                ? { value: kpis.occupancy_rate, label: `${kpis.occupied}/${kpis.total_properties} occupied` }
                : undefined
            }
            variant={kpis.occupancy_rate < 70 ? "warning" : "default"}
          />
          <KpiCard
            title="Monthly Income"
            value={`£${kpis.total_monthly_rent.toLocaleString("en-GB")}`}
            icon={PoundSterling}
          />
          <KpiCard
            title="Open Maintenance"
            value={kpis.open_maintenance}
            icon={Wrench}
            variant={kpis.open_maintenance > 5 ? "warning" : "default"}
          />
        </div>
      </section>

      {/* Health Score */}
      <section aria-label="Portfolio health score" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <HealthScoreCard score={healthScore} />
      </section>

      {/* All Clear Banner OR Action Items (mutually exclusive) */}
      {allClear ? (
        <section aria-label="All clear status">
          <AllClearBanner monthlyCashflow={kpis.total_monthly_rent} />
        </section>
      ) : actionItems.length > 0 ? (
        <section aria-label="Action items">
          <ActionItemsCard items={actionItems} />
        </section>
      ) : null}

      {/* Compliance Alerts */}
      {alertsToShow.length > 0 && (
        <section aria-label="Compliance alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading flex items-center gap-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              <ShieldCheck className="size-5 text-error" />
              Compliance Alerts
            </h3>
            {alerts.length > 3 && (
              <Link
                href="/dashboard/landlord/compliance"
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                View all ({alerts.length})
              </Link>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {alertsToShow.map((doc) => {
              const expiryDate = new Date(doc.expiry_date);
              expiryDate.setHours(0, 0, 0, 0);
              const daysUntilExpiry = Math.ceil(
                (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
              );
              const propertyAddress = `${doc.property.address_line_1}, ${doc.property.city}`;

              return (
                <ComplianceAlertBanner
                  key={doc.id}
                  type={doc.category}
                  propertyAddress={propertyAddress}
                  expiryDate={doc.expiry_date}
                  daysUntilExpiry={daysUntilExpiry}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Key Dates */}
      <section aria-label="Key upcoming dates" className="space-y-4">
        <h3 className="font-heading flex items-center gap-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          <Calendar className="size-5 text-brand-primary" />
          Key Dates
        </h3>
        <KeyDatesTicker dates={keyDates} />
      </section>

      {/* Quick Actions */}
      <section aria-label="Quick actions" className="space-y-4">
        <h3 className="font-heading text-xl font-semibold text-neutral-900 dark:text-neutral-100">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Add Property", href: "/dashboard/landlord/properties/add", description: "Add a new rental to your portfolio" },
            { label: "Log Rent Payment", href: "/dashboard/landlord/rent", description: "Record a rent payment received" },
            { label: "View Compliance", href: "/dashboard/landlord/compliance", description: "Check certificate status" },
            { label: "Maintenance Inbox", href: "/dashboard/landlord/maintenance", description: "View open maintenance requests" },
            { label: "Finance Report", href: "/dashboard/landlord/finance/report", description: "Income & expense overview" },
            { label: "Yield Calculator", href: "/dashboard/landlord/tools/yield-calculator", description: "Calculate gross and net yield" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              aria-label={action.label}
              className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:border-brand-primary/30 hover:shadow-md dark:bg-neutral-900 dark:border-neutral-800"
            >
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-primary transition-colors">
                {action.label}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* PostHog analytics */}
      <DashboardAnalytics
        propertyCount={kpis.total_properties}
        actionItemCount={actionItems.length}
        isAllClear={allClear}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6 md:p-8">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function LandlordDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

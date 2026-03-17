import { Suspense } from "react";
import Link from "next/link";
import { Building2, Percent, PoundSterling, Wrench, Plus, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioKPIs, getHealthScore } from "@/services/landlord/portfolio-service";
import { getComplianceSummary } from "@/services/landlord/document-service";
import { KpiCard } from "@/components/landlord/KpiCard";
import { HealthScoreCard } from "@/components/landlord/HealthScoreCard";
import { ComplianceAlertBanner } from "@/components/landlord/ComplianceAlertBanner";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Dashboard | Landlord | Britestate",
};

async function DashboardContent() {
  const supabase = await createClient();

  const [kpis, complianceDocs, healthScore] = await Promise.all([
    getPortfolioKPIs(supabase),
    getComplianceSummary(supabase),
    getHealthScore(supabase),
  ]);

  // Filter to only expired or expiring_soon documents
  const alerts = complianceDocs.filter(
    (doc) => doc.status === "expired" || doc.status === "expiring_soon",
  );

  // Show max 3 banners
  const alertsToShow = alerts.slice(0, 3);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-8 p-8">
      {/* Welcome Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-[#1B4D3E] p-8 text-white shadow-xl shadow-[#1B4D3E]/10 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <h2 className="mb-4 text-3xl font-black tracking-tight md:text-4xl">
            Landlord Dashboard
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-slate-100 opacity-90">
            {kpis.total_properties === 0
              ? "Get started by adding your first rental property."
              : `Managing ${kpis.total_properties} propert${kpis.total_properties === 1 ? "y" : "ies"}.${
                  kpis.compliance_alerts > 0
                    ? ` You have ${kpis.compliance_alerts} compliance item${kpis.compliance_alerts > 1 ? "s" : ""} requiring attention.`
                    : " All compliance certificates are up to date."
                }`}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard/landlord/properties/add"
              className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-6 py-3 font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <Plus className="size-5" />
              Add Property
            </Link>
            <Link
              href="/dashboard/landlord/compliance"
              className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-6 py-3 font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <ShieldCheck className="size-5" />
              Compliance
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-10">
          <Building2 className="h-full w-full translate-x-1/4 -translate-y-1/4" />
        </div>
      </section>

      {/* Health Score */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <HealthScoreCard score={healthScore} />
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
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
      </section>

      {/* Compliance Alerts */}
      {alertsToShow.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="size-5 text-red-500" />
              Compliance Alerts
            </h3>
            {alerts.length > 3 && (
              <Link
                href="/dashboard/landlord/compliance"
                className="text-sm font-bold text-[#1B4D3E] hover:underline"
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

      {/* Quick Links */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold">Quick Actions</h3>
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
              className="group rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900 dark:border-slate-800"
            >
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1B4D3E]">
                {action.label}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-8">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
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

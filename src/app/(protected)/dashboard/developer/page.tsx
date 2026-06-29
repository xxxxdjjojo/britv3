import type { Metadata } from "next";
import Link from "next/link";
import {
  getDeveloperDashboardData,
  resolveCurrentDeveloper,
} from "@/services/new-homes/dashboard-service";
import { DeveloperGate } from "@/components/new-homes/dashboard/DeveloperGate";
import {
  ConversionFunnel,
  MetricCard,
  SourceAndCost,
  TopDevelopments,
  ViewingsList,
} from "@/components/new-homes/dashboard/DashboardPanels";
import { LeadTable } from "@/components/new-homes/dashboard/LeadTable";
import { formatPercent } from "@/lib/new-homes/metrics";

export const metadata: Metadata = {
  title: "Developer dashboard | TrueDeed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DeveloperDashboardPage() {
  // Membership gate: any authenticated user can reach this URL, but only a
  // linked developer-org member sees a populated dashboard.
  const developer = await resolveCurrentDeveloper();
  if (!developer) return <DeveloperGate />;

  const data = await getDeveloperDashboardData(developer.developerId);
  const { metrics } = data;
  const activeDevelopments = data.developments.filter(
    (d) => d.status !== "sold_out",
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
            Developer dashboard
          </p>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            {developer.developerName}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-neutral-500">
            We don&apos;t sell advertising — we generate qualified buyer demand
            and track every enquiry through to reservation.
          </p>
        </div>
        <Link
          href="/new-homes"
          className="inline-flex h-9 items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-muted"
        >
          View public listings
        </Link>
      </header>

      {/* KPI band */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Enquiry → reservation"
          value={formatPercent(metrics.enquiryToReservation)}
          hint={`${metrics.reservationRequests} reservations from ${metrics.totalEnquiries} enquiries`}
          accent
        />
        <MetricCard
          label="Total enquiries"
          value={metrics.totalEnquiries}
          hint={`${metrics.qualifiedEnquiries} qualified`}
        />
        <MetricCard
          label="Viewings booked"
          value={metrics.viewingBookings}
          hint={`${formatPercent(metrics.enquiryToViewing)} of enquiries`}
        />
        <MetricCard
          label="Active developments"
          value={activeDevelopments}
          hint={`${data.developments.length} total`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Qualified enquiries" value={metrics.qualifiedEnquiries} />
        <MetricCard label="Brochure downloads" value={metrics.brochureDownloads} />
        <MetricCard label="Reservation requests" value={metrics.reservationRequests} />
        <MetricCard
          label="Viewing → reservation"
          value={formatPercent(metrics.viewingToReservation)}
        />
      </div>

      {/* Funnel + source */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ConversionFunnel metrics={metrics} />
        </div>
        <SourceAndCost metrics={metrics} />
      </div>

      {/* Top developments + viewings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopDevelopments rows={data.topDevelopments} />
        <ViewingsList viewings={data.viewings} />
      </div>

      {/* Leads */}
      <LeadTable leads={data.leads} />
    </div>
  );
}

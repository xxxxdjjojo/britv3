import type { Metadata } from "next";
import {
  getDeveloperDashboardData,
  resolveCurrentDeveloper,
} from "@/services/new-homes/dashboard-service";
import { DeveloperGate } from "@/components/new-homes/dashboard/DeveloperGate";
import { LeadTable } from "@/components/new-homes/dashboard/LeadTable";

export const metadata: Metadata = {
  title: "Leads | Developer dashboard | TrueDeed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DeveloperLeadsPage() {
  const developer = await resolveCurrentDeveloper();
  if (!developer) return <DeveloperGate />;

  const data = await getDeveloperDashboardData(developer.developerId);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
          {developer.developerName}
        </p>
        <h1 className="font-heading text-3xl font-bold text-neutral-900">Leads</h1>
        <p className="mt-1 max-w-xl text-sm text-neutral-500">
          Every qualified buyer enquiry across your developments — searchable and
          exportable. {data.metrics.qualifiedEnquiries} of {data.metrics.totalEnquiries}{" "}
          enquiries are qualified.
        </p>
      </header>
      <LeadTable leads={data.leads} />
    </div>
  );
}

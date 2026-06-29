import type { Metadata } from "next";
import Link from "next/link";
import {
  getDeveloperDashboardData,
  resolveCurrentDeveloper,
} from "@/services/new-homes/dashboard-service";
import { DeveloperGate } from "@/components/new-homes/dashboard/DeveloperGate";
import { developmentStatusLabel } from "@/lib/new-homes/format";
import type { DevelopmentStatus } from "@/lib/new-homes/types";

export const metadata: Metadata = {
  title: "Developments | Developer dashboard | TrueDeed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DeveloperDevelopmentsPage() {
  const developer = await resolveCurrentDeveloper();
  if (!developer) return <DeveloperGate />;

  const data = await getDeveloperDashboardData(developer.developerId);

  // Per-development enquiry counts from the lead set.
  const enquiriesByDev = new Map<string, number>();
  for (const lead of data.leads) {
    enquiriesByDev.set(
      lead.developmentId,
      (enquiriesByDev.get(lead.developmentId) ?? 0) + 1,
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
          {developer.developerName}
        </p>
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Developments
        </h1>
        <p className="mt-1 max-w-xl text-sm text-neutral-500">
          {data.developments.length} schemes. Track availability and demand per
          development.
        </p>
      </header>

      {data.developments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-muted py-16 text-center">
          <p className="text-sm text-neutral-500">
            No developments yet. Contact TrueDeed to onboard your first scheme.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.developments.map((dev) => (
            <div
              key={dev.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-heading text-lg font-semibold text-neutral-900">
                  {dev.name}
                </h2>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-neutral-600">
                  {developmentStatusLabel(dev.status as DevelopmentStatus)}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-muted p-3">
                  <dt className="text-xs text-neutral-500">Available</dt>
                  <dd className="font-heading text-lg font-bold text-brand-primary">
                    {dev.availableUnits ?? "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <dt className="text-xs text-neutral-500">Total units</dt>
                  <dd className="font-heading text-lg font-bold text-neutral-900">
                    {dev.totalUnits ?? "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <dt className="text-xs text-neutral-500">Enquiries</dt>
                  <dd className="font-heading text-lg font-bold text-neutral-900">
                    {enquiriesByDev.get(dev.id) ?? 0}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/new-homes/${dev.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-semibold text-brand-primary hover:underline"
              >
                View public listing →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

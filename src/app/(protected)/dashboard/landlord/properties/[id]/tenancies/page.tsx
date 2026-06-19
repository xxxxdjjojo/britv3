import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTenancies } from "@/services/landlord/tenancy-service";
import { TenancyStatusBadge } from "@/components/landlord/TenancyStatusBadge";
import { TenancyForm } from "@/components/landlord/TenancyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TenancyStatus } from "@/types/landlord";

export const metadata = {
  title: "Tenancies | TrueDeed",
};

export default async function TenanciesPage(
  props: Readonly<{
    params: Promise<{ id: string }>;
    searchParams: Promise<{ new?: string }>;
  }>,
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const showForm = searchParams.new === "true";

  const supabase = await createClient();
  const tenancies = await getTenancies(supabase, id);

  const activeTenancies = tenancies.filter(
    (t) => t.status === "active" || t.status === "ending_soon",
  );
  const pastTenancies = tenancies.filter(
    (t) => t.status === "ended" || t.status === "terminated",
  );

  return (
    <div className="space-y-8">
      {/* Page header — eyebrow + title + actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
            Property Tenancies
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark">
            Tenancies
          </h1>
        </div>
        {!showForm && (
          <Link
            href={`/dashboard/landlord/properties/${id}/tenancies?new=true`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Add Tenancy
          </Link>
        )}
      </div>

      {/* New tenancy form */}
      {showForm && (
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle>New Tenancy</CardTitle>
          </CardHeader>
          <CardContent>
            <TenancyForm propertyId={id} mode="create" />
          </CardContent>
        </Card>
      )}

      {/* Bento grid: 8-col main + 4-col sidebar */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Left column — active + history */}
        <div className="space-y-6 md:col-span-8">
          {/* Active tenancies */}
          <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            {/* Section header strip */}
            <div className="flex items-center justify-between border-b border-border bg-success/5 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                <h2 className="font-heading text-base font-bold text-brand-primary-dark">
                  Active
                </h2>
              </div>
            </div>

            {activeTenancies.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">
                No active tenancies.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {activeTenancies.map((t) => (
                  <Link
                    key={t.id}
                    href={`/dashboard/landlord/properties/${id}/tenancies/${t.id}`}
                    className="block"
                  >
                    <div className="p-8 transition-colors hover:bg-surface">
                      {/* Tenant identity row */}
                      <div className="flex flex-col gap-6 md:flex-row md:items-start">
                        {/* Avatar initials */}
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-lg font-bold text-brand-primary-dark">
                          {t.tenant_name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div className="flex-grow space-y-4">
                          <div>
                            <p className="font-heading text-2xl font-bold text-neutral-900">
                              {t.tenant_name}
                            </p>
                          </div>

                          {/* Date + rent metadata grid */}
                          <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                                Start Date
                              </p>
                              <p className="text-sm font-semibold">
                                {new Date(t.lease_start_date).toLocaleDateString(
                                  "en-GB",
                                )}
                              </p>
                            </div>
                            {t.lease_end_date && (
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                                  End Date
                                </p>
                                <p className="text-sm font-semibold">
                                  {new Date(t.lease_end_date).toLocaleDateString(
                                    "en-GB",
                                  )}
                                </p>
                              </div>
                            )}
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                                Rent Level
                              </p>
                              <p className="text-sm font-semibold text-success">
                                {new Intl.NumberFormat("en-GB", {
                                  style: "currency",
                                  currency: "GBP",
                                  minimumFractionDigits: 0,
                                }).format(t.rent_amount)}
                                /{t.rent_frequency}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="md:flex-shrink-0">
                          <TenancyStatusBadge status={t.status as TenancyStatus} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Historical tenancies */}
          {pastTenancies.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              {/* Section header */}
              <div className="border-b border-border px-6 py-4">
                <h2 className="font-heading text-base font-bold text-neutral-900">
                  History
                </h2>
              </div>

              {/* Table layout */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-surface text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                      <th className="px-6 py-4">Tenant Name</th>
                      <th className="px-6 py-4">Period</th>
                      <th className="px-6 py-4">Rent</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {pastTenancies.map((t) => (
                      <tr
                        key={t.id}
                        className="transition-colors hover:bg-surface"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/landlord/properties/${id}/tenancies/${t.id}`}
                            className="flex items-center gap-3"
                          >
                            {/* Avatar initials */}
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-neutral-600 border border-border">
                              {t.tenant_name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <span className="font-semibold text-neutral-800">
                              {t.tenant_name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-neutral-600">
                          {new Date(t.lease_start_date).toLocaleDateString(
                            "en-GB",
                          )}
                          {t.lease_end_date && (
                            <>
                              {" "}
                              &ndash;{" "}
                              {new Date(t.lease_end_date).toLocaleDateString(
                                "en-GB",
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-700">
                          {new Intl.NumberFormat("en-GB", {
                            style: "currency",
                            currency: "GBP",
                            minimumFractionDigits: 0,
                          }).format(t.rent_amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <TenancyStatusBadge status={t.status as TenancyStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar — summary stats */}
        <div className="space-y-6 md:col-span-4">
          {/* Tenancy summary card */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-heading text-base font-bold text-neutral-900">
              Summary
            </h3>
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                  Active Tenancies
                </p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">
                  {activeTenancies.length}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                  Total Tenancies
                </p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">
                  {tenancies.length}
                </p>
              </div>
              {activeTenancies.length > 0 && (
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                    Current Rent
                  </p>
                  <p className="mt-1 text-xl font-bold text-success">
                    {new Intl.NumberFormat("en-GB", {
                      style: "currency",
                      currency: "GBP",
                      minimumFractionDigits: 0,
                    }).format(
                      activeTenancies.reduce(
                        (sum, t) => sum + t.rent_amount,
                        0,
                      ),
                    )}
                    /mo
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Past tenancies quick-view */}
          {pastTenancies.length > 0 && (
            <div className="rounded-2xl border border-border bg-brand-primary p-6 shadow-lg">
              <h3 className="mb-4 font-heading text-base font-bold text-white">
                History
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] text-white/70 uppercase tracking-[0.1em]">
                  <span>Past tenancies</span>
                  <span>{pastTenancies.length}</span>
                </div>
                {/* Mini bar representing tenure count */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-brand-gold"
                    style={{
                      width: `${Math.min(
                        100,
                        (pastTenancies.length / Math.max(tenancies.length, 1)) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

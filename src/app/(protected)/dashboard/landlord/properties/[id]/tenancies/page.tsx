import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTenancies } from "@/services/landlord/tenancy-service";
import { TenancyStatusBadge } from "@/components/landlord/TenancyStatusBadge";
import { TenancyForm } from "@/components/landlord/TenancyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TenancyStatus } from "@/types/landlord";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, ChevronRight, Clock, CalendarDays } from "lucide-react";

export const metadata = {
  title: "Tenancies | Britestate",
};


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent(
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-on-surface dark:text-neutral-100">
              Tenancy History
            </h1>
            <p className="text-sm text-muted-foreground">
              {tenancies.length === 0
                ? "No tenancies recorded yet"
                : `${tenancies.length} tenanc${tenancies.length === 1 ? "y" : "ies"} total`}
            </p>
          </div>
        </div>
        {!showForm && (
          <Link
            href={`/dashboard/landlord/properties/${id}/tenancies?new=true`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="size-4" />
            Add Tenancy
          </Link>
        )}
      </div>

      {/* Summary stats */}
      {tenancies.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="mt-1 text-2xl font-bold font-heading text-foreground">{tenancies.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</p>
            <p className="mt-1 text-2xl font-bold font-heading text-brand-primary dark:text-emerald-400">
              {activeTenancies.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ended</p>
            <p className="mt-1 text-2xl font-bold font-heading text-muted-foreground">
              {pastTenancies.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Rent</p>
            <p className="mt-1 text-2xl font-bold font-heading text-foreground">
              {tenancies.length > 0
                ? formatCurrency(
                    tenancies.reduce((sum, t) => sum + t.rent_amount, 0) / tenancies.length,
                  )
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-semibold">New Tenancy</CardTitle>
          </CardHeader>
          <CardContent>
            <TenancyForm propertyId={id} mode="create" />
          </CardContent>
        </Card>
      )}

      {/* Active tenancies */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-brand-primary dark:text-emerald-400" />
          <h2 className="font-heading text-base font-semibold text-foreground">Active</h2>
          {activeTenancies.length > 0 && (
            <span className="rounded-full bg-brand-primary-lighter px-2 py-0.5 text-xs font-medium text-brand-primary dark:bg-emerald-900/40 dark:text-emerald-300">
              {activeTenancies.length}
            </span>
          )}
        </div>

        {activeTenancies.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-10 text-center">
            <Users className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No active tenancies</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add a tenancy to get started</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activeTenancies.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/landlord/properties/${id}/tenancies/${t.id}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {t.tenant_name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <span className="font-medium text-foreground">
                      {formatCurrency(t.rent_amount)}/{t.rent_frequency}
                    </span>
                    {t.lease_end_date && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          Ends {formatDate(t.lease_end_date)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <TenancyStatusBadge status={t.status as TenancyStatus} />
                  <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Past tenancies — timeline */}
      {pastTenancies.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h2 className="font-heading text-base font-semibold text-foreground">History</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {pastTenancies.length}
            </span>
          </div>

          {/* Timeline */}
          <div className="relative ml-2 flex flex-col gap-0">
            {/* Vertical line */}
            <div className="absolute left-3 top-4 bottom-4 w-px bg-border" />

            {pastTenancies.map((t, idx) => (
              <div key={t.id} className="relative flex gap-4 pb-4 last:pb-0">
                {/* Timeline dot */}
                <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background">
                  <div className="size-2 rounded-full bg-muted-foreground/40" />
                </div>

                <Link
                  href={`/dashboard/landlord/properties/${id}/tenancies/${t.id}`}
                  className="group flex flex-1 items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 transition-all hover:border-primary/20 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
                      {t.tenant_name}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {formatDate(t.lease_start_date)}
                      {t.lease_end_date && (
                        <> &ndash; {formatDate(t.lease_end_date)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {formatCurrency(t.rent_amount)}/{t.rent_frequency}
                    </span>
                    <TenancyStatusBadge status={t.status as TenancyStatus} />
                    <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {tenancies.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mb-4">
            <Users className="size-7 text-muted-foreground/50" />
          </div>
          <h3 className="font-heading text-base font-semibold text-foreground">No tenancies yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Add your first tenancy to start tracking rent, dates, and history for this property.
          </p>
          <Link
            href={`/dashboard/landlord/properties/${id}/tenancies?new=true`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Add First Tenancy
          </Link>
        </div>
      )}
    </div>
  );
}

export default function TenanciesPage(
  props: Readonly<{
    params: Promise<{ id: string }>;
    searchParams: Promise<{ new?: string }>;
  }>,
) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent {...props} />
    </Suspense>
  );
}

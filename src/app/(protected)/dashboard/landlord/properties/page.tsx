import { Suspense } from "react";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioProperties } from "@/services/landlord/portfolio-service";
import { PortfolioGrid } from "@/components/landlord/PortfolioGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Properties | Landlord Dashboard | Britestate",
};

async function PropertiesContent() {
  const supabase = await createClient();
  const properties = await getPortfolioProperties(supabase);

  const occupied = properties.filter(
    (p) => p.tenancy_status === "active" || p.tenancy_status === "ending_soon",
  ).length;
  const vacant = properties.length - occupied;

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">
            Active Management
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            Portfolio
          </h1>
          <p className="text-sm text-muted-foreground">
            Managing {properties.length} propert{properties.length !== 1 ? "ies" : "y"} &mdash;{" "}
            {occupied} occupied, {vacant} vacant
          </p>
        </div>
        <Button
          asChild
          className="bg-brand-gold text-brand-gold-foreground shadow-sm hover:bg-brand-gold/90"
        >
          <Link href="/dashboard/landlord/properties/add">
            <Plus className="mr-2 size-4" />
            Add New Property
          </Link>
        </Button>
      </div>

      {/* Summary stats */}
      {properties.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="mt-2 font-heading text-3xl font-bold text-brand-primary-dark">
              {properties.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Occupied
            </p>
            <p className="mt-2 font-heading text-3xl font-bold text-brand-primary">
              {occupied}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vacant
            </p>
            <p className="mt-2 font-heading text-3xl font-bold text-foreground">
              {vacant}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Occupancy
            </p>
            <p className="mt-2 font-heading text-3xl font-bold text-brand-primary-dark">
              {properties.length > 0
                ? `${Math.round((occupied / properties.length) * 100)}%`
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Property grid */}
      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <Building2 className="size-8" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-bold text-brand-primary-dark">
            No properties yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first rental property to start managing your portfolio.
          </p>
          <Button
            asChild
            className="mt-6 bg-brand-gold text-brand-gold-foreground shadow-sm hover:bg-brand-gold/90"
          >
            <Link href="/dashboard/landlord/properties/add">
              <Plus className="mr-2 size-4" />
              Add New Property
            </Link>
          </Button>
        </div>
      ) : (
        <PortfolioGrid properties={properties} />
      )}
    </div>
  );
}

function PropertiesSkeleton() {
  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertiesSkeleton />}>
      <PropertiesContent />
    </Suspense>
  );
}

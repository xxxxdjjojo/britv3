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
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            My Properties
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {properties.length} propert{properties.length !== 1 ? "ies" : "y"} &mdash;{" "}
            {occupied} occupied, {vacant} vacant
          </p>
        </div>
        <Button asChild aria-label="Add a new property" className="bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl">
          <Link href="/dashboard/landlord/properties/add">
            <Plus className="mr-2 size-4" />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Summary stats */}
      {properties.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Total</p>
            <p className="mt-1.5 font-heading text-2xl font-bold text-neutral-900 dark:text-neutral-100">{properties.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Occupied</p>
            <p className="mt-1.5 font-heading text-2xl font-bold text-success">{occupied}</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Vacant</p>
            <p className="mt-1.5 font-heading text-2xl font-bold text-neutral-600">{vacant}</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Occupancy</p>
            <p className="mt-1.5 font-heading text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {properties.length > 0
                ? `${Math.round((occupied / properties.length) * 100)}%`
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Property grid */}
      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-24 text-center dark:border-neutral-700">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <Building2 className="size-8" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            No properties yet
          </h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Add your first rental property to start managing your portfolio.
          </p>
          <Button asChild className="mt-6 bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl" aria-label="Add your first property">
            <Link href="/dashboard/landlord/properties/add">
              <Plus className="mr-2 size-4" />
              Add Property
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
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
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

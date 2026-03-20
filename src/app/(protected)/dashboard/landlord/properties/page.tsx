import { Suspense } from "react";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioProperties } from "@/services/landlord/portfolio-service";
import { PortfolioGrid } from "@/components/landlord/PortfolioGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Properties | Landlord Dashboard",
};

async function PropertiesContent() {
  const supabase = await createClient();
  const properties = await getPortfolioProperties(supabase);

  const occupied = properties.filter(
    (p) => p.tenancy_status === "active" || p.tenancy_status === "ending_soon",
  ).length;
  const vacant = properties.length - occupied;

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Portfolio Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Managing {properties.length} propert{properties.length !== 1 ? "ies" : "y"} &mdash;{" "}
            {occupied} occupied, {vacant} vacant
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/landlord/properties/add">
            <Plus className="mr-2 size-4" />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Summary stats */}
      {properties.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold">{properties.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Occupied</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{occupied}</p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Vacant</p>
            <p className="mt-1 text-2xl font-bold text-slate-600">{vacant}</p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Occupancy</p>
            <p className="mt-1 text-2xl font-bold">
              {properties.length > 0
                ? `${Math.round((occupied / properties.length) * 100)}%`
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Property grid */}
      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E]">
            <Building2 className="size-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
            No properties yet
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Add your first rental property to start managing your portfolio.
          </p>
          <Button asChild className="mt-6">
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
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-36" />
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

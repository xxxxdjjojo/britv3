import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRentCollection } from "@/services/landlord/financial-service";
import { getTenancies } from "@/services/landlord/tenancy-service";
import { Button } from "@/components/ui/button";
import { ChevronLeft, TrendingUp, Calendar, PoundSterling, CheckCircle2 } from "lucide-react";
import { PropertyRentClient } from "./PropertyRentClient";
import type { RentCollectionEntry } from "@/types/landlord";
import { Skeleton } from "@/components/ui/skeleton";

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type PageProps = {
  params: Promise<{ propertyId: string }>;
};

/**
 * 9.11 Individual Property Rent page — Server Component.
 * Fetches payment history + tenancy info server-side.
 * Passes entries to PropertyRentClient for optimistic Mark Paid mutations.
 */

function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-64 mt-2" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

async function PageContent({ params }: PageProps) {
  const { propertyId } = await params;
  const supabase = await createClient();

  // Fetch rent entries for this property (queries financial_entries WHERE category='rent')
  const rentGroups = await getRentCollection(supabase, propertyId).catch(() => ({
    paid: [] as RentCollectionEntry[],
    partial: [] as RentCollectionEntry[],
    overdue: [] as RentCollectionEntry[],
  }));
  const allEntries: RentCollectionEntry[] = [
    ...rentGroups.paid,
    ...rentGroups.partial,
    ...rentGroups.overdue,
  ];

  // Fetch current tenancy for header info
  let activeTenancyName = "No active tenancy";
  let currentRentAmount = 0;
  let propertyAddress = "";

  try {
    const tenancies = await getTenancies(supabase, propertyId, "active");
    if (tenancies.length > 0) {
      const tenancy = tenancies[0];
      activeTenancyName = tenancy.tenant_name;
      currentRentAmount = tenancy.rent_amount;
    }
  } catch {
    // Non-critical — continue with defaults
  }

  if (allEntries.length > 0) {
    propertyAddress = allEntries[0].property_address;
  }

  // Calculate summary stats (last 12 months)
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

  const yearEntries = allEntries.filter((e) => {
    const entryDate = new Date(e.entry.entry_date);
    return entryDate >= twelveMonthsAgo;
  });

  const totalCollected = yearEntries
    .filter((e) => (e.entry.payment_status ?? "") === "paid")
    .reduce((sum, e) => sum + e.entry.amount, 0);

  const totalOwed = yearEntries
    .filter(
      (e) =>
        (e.entry.payment_status ?? "") === "overdue" ||
        (e.entry.payment_status ?? "") === "partial",
    )
    .reduce((sum, e) => sum + e.entry.amount, 0);

  // Last payment date — most recent paid entry
  const paidEntries = allEntries
    .filter((e) => (e.entry.payment_status ?? "") === "paid")
    .sort(
      (a, b) =>
        new Date(b.entry.entry_date).getTime() -
        new Date(a.entry.entry_date).getTime(),
    );
  const lastPaymentDate =
    paidEntries.length > 0 ? paidEntries[0].entry.entry_date : null;

  const totalExpected = totalCollected + totalOwed;
  const collectionRate = totalExpected > 0
    ? Math.round((totalCollected / totalExpected) * 100)
    : 0;

  // Last 24 entries for display (approx last 12 months of monthly rent)
  const displayEntries = allEntries.slice(0, 24);

  return (
    <div className="space-y-6 p-6">
      {/* Back link */}
      <Link
        href="/dashboard/landlord/rent"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to Rent Collection
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {propertyAddress || `Property ${propertyId}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeTenancyName}
            {currentRentAmount > 0 &&
              ` · ${gbpFormatter.format(currentRentAmount)}/mo`}
          </p>
        </div>
        <Button
          size="sm"
          className="bg-brand-primary hover:bg-brand-primary/90 text-white dark:bg-primary dark:hover:bg-primary/90"
          asChild
        >
          <Link href="/dashboard/landlord/rent">Log Payment</Link>
        </Button>
      </div>

      {/* Summary KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Collected */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Collected
            </p>
            <span className="rounded-lg bg-success-light p-1.5 dark:bg-success/10">
              <TrendingUp className="size-3.5 text-success dark:text-success" />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-success dark:text-success">
            {gbpFormatter.format(totalCollected)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last 12 months · {collectionRate}% rate
          </p>
        </div>

        {/* Total Owed */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Outstanding
            </p>
            <span className="rounded-lg bg-error-light p-1.5 dark:bg-error/10">
              <PoundSterling className="size-3.5 text-error dark:text-error" />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-error dark:text-error">
            {gbpFormatter.format(totalOwed)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Overdue / partial</p>
        </div>

        {/* Last Payment */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Last Payment
            </p>
            <span className="rounded-lg bg-brand-accent-light p-1.5 dark:bg-brand-accent/10">
              <Calendar className="size-3.5 text-brand-accent dark:text-brand-accent" />
            </span>
          </div>
          <p className="mt-3 font-heading text-xl font-bold text-foreground">
            {formatDate(lastPaymentDate)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Most recent paid</p>
        </div>
      </div>

      {/* Payment history table — client component handles Mark Paid mutations */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-brand-primary dark:text-primary" />
            <h2 className="font-heading text-base font-semibold text-foreground">
              Payment History
            </h2>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Last 12 months
            </span>
          </div>
        </div>
        <PropertyRentClient entries={displayEntries} />
      </div>
    </div>
  );
}

export default function PropertyRentPage({ params }: PageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}

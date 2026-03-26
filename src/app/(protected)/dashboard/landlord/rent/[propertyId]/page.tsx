import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRentCollection } from "@/services/landlord/financial-service";
import { getTenancies } from "@/services/landlord/tenancy-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
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
      <Skeleton className="h-8 w-48 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({ params }: PageProps) {
  const { propertyId } = await params;
  const supabase = await createClient();

  // Fetch rent entries for this property (queries financial_entries WHERE category='rent')
  const rentGroups = await getRentCollection(supabase, propertyId);
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

  // Last 24 entries for display (approx last 12 months of monthly rent)
  const displayEntries = allEntries.slice(0, 24);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/landlord/rent"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to Rent Collection
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {propertyAddress || `Property ${propertyId}`}
          </h1>
          <p className="text-muted-foreground">
            {activeTenancyName}
            {currentRentAmount > 0 &&
              ` · ${gbpFormatter.format(currentRentAmount)}/mo`}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/landlord/rent">Log Payment</Link>
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">
              Total Collected (Year)
            </p>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">
              {gbpFormatter.format(totalCollected)}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">
              Total Owed (Outstanding)
            </p>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">
              {gbpFormatter.format(totalOwed)}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Last Payment</p>
            <CardTitle className="text-xl">
              {formatDate(lastPaymentDate)}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      </div>

      {/* Payment history table — client component handles Mark Paid mutations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Payment History (Last 12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PropertyRentClient entries={displayEntries} />
        </CardContent>
      </Card>
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

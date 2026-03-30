import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getFinancialEntries } from "@/services/landlord/financial-service";
import { FinancialSummary } from "@/components/landlord/FinancialSummary";
import { FinancialEntryForm } from "@/components/landlord/FinancialEntryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialEntry, Tenancy } from "@/types/landlord";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Financials | Britestate",
};

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});


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
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const { id: propertyId } = await props.params;
  const supabase = await createClient();

  // Fetch recent entries and active tenancies in parallel
  const [entries, tenanciesResult] = await Promise.all([
    getFinancialEntries(supabase, propertyId),
    supabase
      .from("tenancies")
      .select("*")
      .eq("property_id", propertyId)
      .in("status", ["active", "ending_soon"])
      .order("created_at", { ascending: false }),
  ]);

  const tenancies = (tenanciesResult.data ?? []) as Tenancy[];

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Financials</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Track income and expenses for this property
        </p>
      </div>

      {/* Financial summary with period selection */}
      <FinancialSummary propertyId={propertyId} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Log entry form */}
        <Card className="bg-white rounded-2xl border border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-semibold text-neutral-900 dark:text-neutral-100">Log Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialEntryForm
              propertyId={propertyId}
              tenancies={tenancies}
            />
          </CardContent>
        </Card>

        {/* Recent entries table */}
        <Card className="bg-white rounded-2xl border border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No entries yet. Use the form to log your first entry.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left dark:border-neutral-800">
                      <th className="pb-3 pr-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Date</th>
                      <th className="pb-3 pr-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Type</th>
                      <th className="pb-3 pr-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Category</th>
                      <th className="pb-3 pr-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-400">Amount</th>
                      <th className="pb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry: FinancialEntry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-neutral-50 last:border-0 dark:border-neutral-800"
                      >
                        <td className="py-3 pr-3 text-neutral-700 dark:text-neutral-300">
                          {new Date(entry.entry_date).toLocaleDateString("en-GB")}
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              entry.type === "income"
                                ? "bg-success-light text-success"
                                : "bg-error-light text-error"
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-3 pr-3 capitalize text-neutral-700 dark:text-neutral-300">
                          {entry.category.replace(/_/g, " ")}
                        </td>
                        <td
                          className={`py-3 pr-3 text-right font-semibold ${
                            entry.type === "income"
                              ? "text-success"
                              : "text-error"
                          }`}
                        >
                          {entry.type === "expense" ? "-" : ""}
                          {gbpFormatter.format(entry.amount)}
                        </td>
                        <td className="py-3">
                          {entry.receipt_url ? (
                            <a
                              href={entry.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-brand-primary hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function FinancialsPage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent {...props} />
    </Suspense>
  );
}

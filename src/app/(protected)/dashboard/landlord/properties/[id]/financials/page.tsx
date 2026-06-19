import { createClient } from "@/lib/supabase/server";
import { getFinancialEntries } from "@/services/landlord/financial-service";
import { FinancialSummary } from "@/components/landlord/FinancialSummary";
import { FinancialEntryForm } from "@/components/landlord/FinancialEntryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialEntry, Tenancy } from "@/types/landlord";

export const metadata = {
  title: "Financials | TrueDeed",
};

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function FinancialsPage(
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financials</h1>
        <p className="text-muted-foreground">
          Track income and expenses for this property
        </p>
      </div>

      {/* Financial summary with period selection */}
      <FinancialSummary propertyId={propertyId} />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Log entry form */}
        <Card>
          <CardHeader>
            <CardTitle>Log Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialEntryForm
              propertyId={propertyId}
              tenancies={tenancies}
            />
          </CardContent>
        </Card>

        {/* Recent entries table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No entries yet. Use the form to log your first entry.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Date</th>
                      <th className="pb-2 pr-3 font-medium">Type</th>
                      <th className="pb-2 pr-3 font-medium">Category</th>
                      <th className="pb-2 pr-3 text-right font-medium">
                        Amount
                      </th>
                      <th className="pb-2 font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry: FinancialEntry) => (
                      <tr
                        key={entry.id}
                        className="border-b last:border-0"
                      >
                        <td className="py-2 pr-3">
                          {new Date(entry.entry_date).toLocaleDateString(
                            "en-GB",
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              entry.type === "income"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-2 pr-3 capitalize">
                          {entry.category.replace(/_/g, " ")}
                        </td>
                        <td
                          className={`py-2 pr-3 text-right font-medium ${
                            entry.type === "income"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {entry.type === "expense" ? "-" : ""}
                          {gbpFormatter.format(entry.amount)}
                        </td>
                        <td className="py-2">
                          {entry.receipt_url ? (
                            <a
                              href={entry.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-600 hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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

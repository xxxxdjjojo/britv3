"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PropertyContextBanner } from "@/components/landlord/PropertyContextBanner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RentCollectionGroup, RentCollectionEntry } from "@/types/landlord";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RentPaymentRow } from "@/components/landlord/RentPaymentRow";
import { FinancialEntryForm } from "@/components/landlord/FinancialEntryForm";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Download } from "lucide-react";

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

type TabKey = "all" | "overdue" | "upcoming";

type RentCollectionClientProps = Readonly<{
  initialData: RentCollectionGroup;
}>;

async function fetchRentCollection(): Promise<RentCollectionGroup> {
  const res = await fetch("/api/landlord/rent");
  if (!res.ok) throw new Error("Failed to load rent collection");
  return res.json() as Promise<RentCollectionGroup>;
}

async function markPaidApi(entryId: string): Promise<void> {
  const res = await fetch(`/api/landlord/rent/${entryId}/mark-paid`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark as paid");
}

/**
 * Client wrapper for Rent Collection Overview (9.10).
 * Uses React Query for data fetching with optimistic updates.
 */
export function RentCollectionClient({ initialData }: RentCollectionClientProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [logPaymentOpen, setLogPaymentOpen] = useState(false);
  const searchParams = useSearchParams();
  const propertyFilter = searchParams.get("property");

  const { data } = useQuery<RentCollectionGroup>({
    queryKey: ["rent-collection"],
    queryFn: fetchRentCollection,
    initialData,
  });

  const markPaidMutation = useMutation({
    mutationFn: markPaidApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rent-collection"] });
      toast.success("Payment marked as paid");
      posthog.capture("landlord_rent_marked_paid");
    },
    onError: () => {
      toast.error("Failed to mark payment as paid");
    },
  });

  // Summary calculations
  const allEntries: RentCollectionEntry[] = [
    ...(data?.paid ?? []),
    ...(data?.partial ?? []),
    ...(data?.overdue ?? []),
  ];

  const totalExpected = allEntries.reduce((sum, e) => sum + e.entry.amount, 0);
  const totalCollected = (data?.paid ?? []).reduce(
    (sum, e) => sum + e.entry.amount,
    0,
  );
  const outstanding = (data?.partial ?? []).reduce(
    (sum, e) => sum + e.entry.amount,
    0,
  );
  const overdueCount = (data?.overdue ?? []).length;
  const collectionRate = totalExpected > 0
    ? Math.round((totalCollected / totalExpected) * 100)
    : 0;

  // Tab entries
  const tabEntries: Record<TabKey, RentCollectionEntry[]> = {
    all: allEntries,
    overdue: data?.overdue ?? [],
    upcoming: data?.partial ?? [],
  };

  const currentEntries = tabEntries[activeTab];

  const displayEntries = propertyFilter
    ? currentEntries.filter((e) => e.entry.property_id === propertyFilter)
    : currentEntries;

  const uniqueProperties = (() => {
    const seen = new Map<string, string>();
    for (const e of allEntries) {
      if (!seen.has(e.entry.property_id)) {
        seen.set(e.entry.property_id, e.property_address);
      }
    }
    return Array.from(seen.entries()).map(([id, address]) => ({ id, address }));
  })();

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All Payments", count: allEntries.length },
    { key: "overdue", label: "Overdue", count: overdueCount },
    {
      key: "upcoming",
      label: "Partial / Upcoming",
      count: (data?.partial ?? []).length,
    },
  ];

  return (
    <div className="space-y-6">
      <PropertyContextBanner properties={uniqueProperties} />

      {/* Overdue alert banner */}
      {overdueCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-900/10">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {overdueCount} overdue payment{overdueCount > 1 ? "s" : ""} require{overdueCount === 1 ? "s" : ""} attention
          </p>
        </div>
      )}

      {/* Summary KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Expected */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Expected
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-foreground">
            {gbpFormatter.format(totalExpected)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">This month</p>
        </div>

        {/* Total Collected */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Collected
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {gbpFormatter.format(totalCollected)}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {collectionRate}% collection rate
            </p>
          </div>
        </div>

        {/* Outstanding */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Outstanding
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-amber-600 dark:text-amber-400">
            {gbpFormatter.format(outstanding)}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <TrendingDown className="size-3 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Partial / pending
            </p>
          </div>
        </div>

        {/* Overdue Count */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Overdue
          </p>
          <p className={`mt-2 font-heading text-2xl font-bold ${overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
            {overdueCount}
          </p>
          <div className="mt-1 flex items-center gap-1">
            {overdueCount > 0 ? (
              <TrendingUp className="size-3 text-red-600 dark:text-red-400" />
            ) : (
              <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
            )}
            <p className={`text-xs ${overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {overdueCount > 0 ? "Late payments" : "All clear"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs + Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-foreground shadow-sm dark:bg-card dark:text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    activeTab === tab.key
                      ? "bg-brand-primary/10 text-brand-primary dark:bg-primary/20 dark:text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-3.5" />
            Export Ledger
          </Button>
          <Button
            size="sm"
            className="bg-brand-primary hover:bg-brand-primary/90 text-white dark:bg-primary dark:hover:bg-primary/90"
            onClick={() => setLogPaymentOpen(true)}
          >
            Log Payment
          </Button>
        </div>
      </div>

      {/* Rent payment table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {displayEntries.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-500" />
              <p className="text-sm font-medium text-foreground">No rent entries found</p>
              <p className="text-xs text-muted-foreground">
                {activeTab === "overdue" ? "No overdue payments — great!" : "Nothing to display"}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tenant</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEntries.map((item) => (
                  <RentPaymentRow
                    key={item.entry.id}
                    entry={{
                      ...item.entry,
                      tenant_name: item.tenant_name,
                      property_address: item.property_address,
                    }}
                    onMarkPaid={(id) => markPaidMutation.mutate(id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Log Payment Sheet */}
      <Sheet open={logPaymentOpen} onOpenChange={setLogPaymentOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Log Rent Payment</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FinancialEntryForm propertyId="" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

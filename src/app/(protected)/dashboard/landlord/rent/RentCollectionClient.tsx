"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RentCollectionGroup, RentCollectionEntry } from "@/types/landlord";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Tab entries
  const tabEntries: Record<TabKey, RentCollectionEntry[]> = {
    all: allEntries,
    overdue: data?.overdue ?? [],
    upcoming: data?.partial ?? [],
  };

  const currentEntries = tabEntries[activeTab];

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: allEntries.length },
    { key: "overdue", label: "Overdue", count: overdueCount },
    {
      key: "upcoming",
      label: "Partial / Upcoming",
      count: (data?.partial ?? []).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Total Expected</p>
            <CardTitle className="text-2xl">
              {gbpFormatter.format(totalExpected)}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Total Collected</p>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">
              {gbpFormatter.format(totalCollected)}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">
              {gbpFormatter.format(outstanding)}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Overdue Count</p>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">
              {overdueCount}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      </div>

      {/* Tabs + Log Payment button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-foreground shadow-sm dark:bg-gray-800"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setLogPaymentOpen(true)}>
          Log Payment
        </Button>
      </div>

      {/* Rent payment table */}
      <Card>
        <CardContent className="p-0">
          {currentEntries.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No rent entries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentEntries.map((item) => (
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
        </CardContent>
      </Card>

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

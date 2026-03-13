"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { DepositRegistration, DepositScheme, DepositStatus } from "@/types/landlord";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DepositCard } from "@/components/landlord/DepositCard";

type DepositWithTenancy = DepositRegistration & {
  tenancy: {
    tenant_name: string;
    property_address: string;
  };
};

type ActiveTenancy = {
  id: string;
  tenant_name: string;
  property_id: string;
};

type DepositFormData = {
  tenancy_id: string;
  amount: number;
  scheme: DepositScheme;
  scheme_reference: string;
  registration_date: string;
  prescribed_info_sent_date: string;
  status: DepositStatus;
  notes: string;
};

type DepositManagementClientProps = Readonly<{
  initialData: DepositWithTenancy[];
  activeTenancies: ActiveTenancy[];
  /** ISO timestamp from server — used for compliance 30-day check */
  serverTimestamp: number;
}>;

async function fetchDeposits(): Promise<DepositWithTenancy[]> {
  const res = await fetch("/api/landlord/deposits");
  if (!res.ok) throw new Error("Failed to load deposits");
  return res.json() as Promise<DepositWithTenancy[]>;
}

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Client wrapper for Deposit Management page (9.25).
 * Uses React Query for data fetching with optimistic update mutations.
 */
export function DepositManagementClient({
  initialData,
  activeTenancies,
  serverTimestamp,
}: DepositManagementClientProps) {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<DepositWithTenancy | null>(null);

  const { data: deposits = initialData } = useQuery<DepositWithTenancy[]>({
    queryKey: ["deposits"],
    queryFn: fetchDeposits,
    initialData,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: DepositFormData) => {
      const res = await fetch("/api/landlord/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create deposit");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deposits"] });
      toast.success("Deposit registration created");
      setSheetOpen(false);
      reset();
    },
    onError: () => {
      toast.error("Failed to create deposit registration");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<DepositFormData>;
    }) => {
      const res = await fetch(`/api/landlord/deposits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update deposit");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deposits"] });
      toast.success("Deposit updated");
      setSheetOpen(false);
      setEditingDeposit(null);
      reset();
    },
    onError: () => {
      toast.error("Failed to update deposit");
    },
  });

  const markRegisteredMutation = useMutation({
    mutationFn: async (depositId: string) => {
      const res = await fetch(`/api/landlord/deposits/${depositId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "registered",
          registration_date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) throw new Error("Failed to mark deposit as registered");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deposits"] });
      toast.success("Deposit marked as registered");
    },
    onError: () => {
      toast.error("Failed to mark deposit as registered");
    },
  });

  const { register, handleSubmit, reset } = useForm<DepositFormData>({
    defaultValues: {
      tenancy_id: "",
      amount: 0,
      scheme: "TDS",
      scheme_reference: "",
      registration_date: "",
      prescribed_info_sent_date: "",
      status: "pending",
      notes: "",
    },
  });

  function handleOpenCreate() {
    setEditingDeposit(null);
    reset({
      tenancy_id: "",
      amount: 0,
      scheme: "TDS",
      scheme_reference: "",
      registration_date: "",
      prescribed_info_sent_date: "",
      status: "pending",
      notes: "",
    });
    setSheetOpen(true);
  }

  function handleOpenEdit(deposit: DepositWithTenancy) {
    setEditingDeposit(deposit);
    reset({
      tenancy_id: deposit.tenancy_id,
      amount: deposit.amount,
      scheme: deposit.scheme,
      scheme_reference: deposit.scheme_reference ?? "",
      registration_date: deposit.registration_date ?? "",
      prescribed_info_sent_date: deposit.prescribed_info_sent_date ?? "",
      status: deposit.status,
      notes: deposit.notes ?? "",
    });
    setSheetOpen(true);
  }

  function onSubmit(formData: DepositFormData) {
    if (editingDeposit) {
      updateMutation.mutate({ id: editingDeposit.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  // Summary stats
  const totalHeld = deposits
    .filter((d) => d.status === "pending" || d.status === "registered")
    .reduce((sum, d) => sum + d.amount, 0);
  const registeredCount = deposits.filter((d) => d.status === "registered").length;
  const pendingCount = deposits.filter((d) => d.status === "pending").length;
  const disputedCount = deposits.filter((d) => d.status === "disputed").length;

  // Compliance warning: deposits unregistered for >30 days
  // serverTimestamp is provided by the Server Component — avoids impure Date.now() in render
  const unregisteredDeposits = useMemo(() => {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    return deposits.filter((d) => {
      if (d.status === "registered" || d.status === "returned") return false;
      if (!d.registration_date) {
        const created = new Date(d.created_at).getTime();
        return serverTimestamp - created > THIRTY_DAYS_MS;
      }
      return false;
    });
  }, [deposits, serverTimestamp]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Compliance warning banner */}
      {unregisteredDeposits.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Compliance warning: {unregisteredDeposits.length} deposit
            {unregisteredDeposits.length > 1 ? "s" : ""} unregistered for more
            than 30 days. Register with a government-approved scheme to avoid
            penalties.
          </p>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Total Deposits Held</p>
            <p className="mt-1 text-2xl font-bold">
              {gbpFormatter.format(totalHeld)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Registered</p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              {registeredCount}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Disputed</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {disputedCount}
            </p>
          </div>
        </Card>
      </div>

      {/* Register New Deposit button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={handleOpenCreate}>
          Register New Deposit
        </Button>
      </div>

      {/* Deposit cards grid */}
      {deposits.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No deposit registrations found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {deposits.map((deposit) => (
            <DepositCard
              key={deposit.id}
              deposit={deposit}
              onEdit={handleOpenEdit}
              onMarkRegistered={(id) => markRegisteredMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Register / Edit Deposit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingDeposit ? "Edit Deposit" : "Register New Deposit"}
            </SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 space-y-4"
          >
            {/* Tenancy select */}
            <div>
              <label
                htmlFor="tenancy_id"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Tenancy
              </label>
              <select
                id="tenancy_id"
                {...register("tenancy_id")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                required
              >
                <option value="">Select tenancy...</option>
                {activeTenancies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tenant_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Deposit Amount (GBP)
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                {...register("amount")}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {/* Scheme */}
            <div>
              <label
                htmlFor="scheme"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Scheme
              </label>
              <select
                id="scheme"
                {...register("scheme")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="TDS">TDS</option>
                <option value="DPS">DPS</option>
                <option value="mydeposits">mydeposits</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Scheme reference */}
            <div>
              <label
                htmlFor="scheme_reference"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Scheme Reference (optional)
              </label>
              <input
                id="scheme_reference"
                type="text"
                {...register("scheme_reference")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {/* Registration date */}
            <div>
              <label
                htmlFor="registration_date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Registration Date (optional)
              </label>
              <input
                id="registration_date"
                type="date"
                {...register("registration_date")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {/* Prescribed info sent date */}
            <div>
              <label
                htmlFor="prescribed_info_sent_date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Prescribed Info Sent Date (optional)
              </label>
              <input
                id="prescribed_info_sent_date"
                type="date"
                {...register("prescribed_info_sent_date")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Status
              </label>
              <select
                id="status"
                {...register("status")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="pending">Pending</option>
                <option value="registered">Registered</option>
                <option value="returned">Returned</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register("notes")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingDeposit
                    ? "Save Changes"
                    : "Register Deposit"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

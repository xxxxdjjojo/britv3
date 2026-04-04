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
import { AlertTriangle, CheckCircle2, Clock, Shield, PoundSterling, Plus } from "lucide-react";

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
        <div className="flex items-start gap-3 rounded-xl border border-warning bg-warning-light p-4 dark:border-warning dark:bg-warning/10">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning dark:text-warning" />
          <div>
            <p className="text-sm font-semibold text-warning dark:text-warning">
              Compliance warning
            </p>
            <p className="mt-0.5 text-sm text-warning dark:text-warning">
              {unregisteredDeposits.length} deposit
              {unregisteredDeposits.length > 1 ? "s" : ""} unregistered for more
              than 30 days. Register with a government-approved scheme to avoid penalties.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total held */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Held
            </p>
            <span className="rounded-lg bg-brand-accent-light p-1.5 dark:bg-brand-accent/10">
              <PoundSterling className="size-3.5 text-brand-accent dark:text-brand-accent" />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-foreground">
            {gbpFormatter.format(totalHeld)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Across all deposits</p>
        </div>

        {/* Registered */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Registered
            </p>
            <span className="rounded-lg bg-success-light p-1.5 dark:bg-success/10">
              <Shield className="size-3.5 text-success dark:text-success" />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-success dark:text-success">
            {registeredCount}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <CheckCircle2 className="size-3 text-success dark:text-success" />
            <p className="text-xs text-success dark:text-success">Protected</p>
          </div>
        </div>

        {/* Pending */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pending
            </p>
            <span className="rounded-lg bg-warning-light p-1.5 dark:bg-warning/10">
              <Clock className="size-3.5 text-warning dark:text-warning" />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-warning dark:text-warning">
            {pendingCount}
          </p>
          <p className="mt-1 text-xs text-warning dark:text-warning">
            {pendingCount > 0 ? "Awaiting registration" : "All registered"}
          </p>
        </div>

        {/* Disputed */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Disputed
            </p>
            <span className="rounded-lg bg-error-light p-1.5 dark:bg-error/10">
              <AlertTriangle className="size-3.5 text-error dark:text-error" />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-error dark:text-error">
            {disputedCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {disputedCount > 0 ? "Under review" : "No disputes"}
          </p>
        </div>
      </div>

      {/* Register New Deposit button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          className="gap-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white dark:bg-primary dark:hover:bg-primary/90"
          onClick={handleOpenCreate}
        >
          <Plus className="size-3.5" />
          Register New Deposit
        </Button>
      </div>

      {/* Deposit cards grid */}
      {deposits.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card">
          <Shield className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No deposit registrations found.</p>
        </div>
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
                className="block text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                Tenancy
              </label>
              <select
                id="tenancy_id"
                {...register("tenancy_id")}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
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
                className="block text-sm font-medium text-neutral-600 dark:text-neutral-300"
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
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Scheme */}
            <div>
              <label
                htmlFor="scheme"
                className="block text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                Scheme
              </label>
              <select
                id="scheme"
                {...register("scheme")}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
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
                className="block text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                Scheme Reference (optional)
              </label>
              <input
                id="scheme_reference"
                type="text"
                {...register("scheme_reference")}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Registration date */}
            <div>
              <label
                htmlFor="registration_date"
                className="block text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                Registration Date (optional)
              </label>
              <input
                id="registration_date"
                type="date"
                {...register("registration_date")}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Prescribed info sent date */}
            <div>
              <label
                htmlFor="prescribed_info_sent_date"
                className="block text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                Prescribed Info Sent Date (optional)
              </label>
              <input
                id="prescribed_info_sent_date"
                type="date"
                {...register("prescribed_info_sent_date")}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                Status
              </label>
              <select
                id="status"
                {...register("status")}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
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
                className="block text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register("notes")}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
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

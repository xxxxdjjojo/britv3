"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { DepositRegistration, DepositScheme, DepositStatus } from "@/types/landlord";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, AlertCircle, Clock, CheckCircle2, Filter, Download, PoundSterling } from "lucide-react";

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

// ---------------------------------------------------------------------------
// DepositTableRow — one row in the tenancy deposits table
// ---------------------------------------------------------------------------

function formatUKDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const SCHEME_LABELS: Record<string, string> = {
  TDS: "TDS",
  DPS: "DPS",
  mydeposits: "mydeposits",
  other: "Other",
};

const STATUS_STYLES: Record<
  DepositStatus,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-warning/10",
    text: "text-warning",
    label: "Pending",
  },
  registered: {
    bg: "bg-success/10",
    text: "text-success",
    label: "Registered",
  },
  returned: {
    bg: "bg-neutral-100",
    text: "text-neutral-500",
    label: "Returned",
  },
  disputed: {
    bg: "bg-error/10",
    text: "text-error",
    label: "Disputed",
  },
};

type DepositTableRowProps = Readonly<{
  deposit: DepositWithTenancy;
  onEdit: (deposit: DepositWithTenancy) => void;
  onMarkRegistered: (id: string) => void;
}>;

function DepositTableRow({ deposit, onEdit, onMarkRegistered }: DepositTableRowProps) {
  const statusStyle = STATUS_STYLES[deposit.status] ?? STATUS_STYLES.pending;
  const schemeName = SCHEME_LABELS[deposit.scheme] ?? deposit.scheme;

  // Initials avatar from tenant name
  const initials = deposit.tenancy.tenant_name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <TableRow className="border-border">
      {/* Tenant & Property */}
      <TableCell className="pl-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-[11px] font-bold text-brand-primary">
            {initials}
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-neutral-900">
              {deposit.tenancy.tenant_name}
            </p>
            <p className="text-xs text-neutral-500">
              {deposit.tenancy.property_address || "Unknown property"}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Deposit Amount */}
      <TableCell className="text-sm font-semibold text-neutral-900">
        {gbpFormatter.format(deposit.amount)}
      </TableCell>

      {/* Scheme */}
      <TableCell>
        <span className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
          {schemeName}
        </span>
      </TableCell>

      {/* Registration date */}
      <TableCell className="text-sm">
        {deposit.registration_date ? (
          <span className="text-neutral-700">{formatUKDate(deposit.registration_date)}</span>
        ) : (
          <span className="text-warning text-xs font-medium">Not registered</span>
        )}
      </TableCell>

      {/* Prescribed info sent */}
      <TableCell className="text-sm">
        {deposit.prescribed_info_sent_date ? (
          <span className="text-neutral-700">{formatUKDate(deposit.prescribed_info_sent_date)}</span>
        ) : (
          <span className="text-warning text-xs font-medium">Not sent</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
        >
          {statusStyle.label}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell className="pr-5">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => onEdit(deposit)}
          >
            Edit
          </Button>
          {deposit.status === "pending" && (
            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onMarkRegistered(deposit.id)}
            >
              Mark Registered
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------

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
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p className="text-sm font-medium text-warning">
            Compliance warning: {unregisteredDeposits.length} deposit
            {unregisteredDeposits.length > 1 ? "s" : ""} unregistered for more
            than 30 days. Register with a government-approved scheme to avoid
            penalties.
          </p>
        </div>
      )}

      {/* Summary stats + CTA */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1 — Total Deposits Held */}
        <Card className="rounded-xl border-border">
          <CardContent className="flex items-start gap-3 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
              <PoundSterling className="size-5 text-brand-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                Total Deposits Held
              </p>
              <p className="font-heading text-2xl font-bold tracking-tight text-brand-primary-dark">
                {gbpFormatter.format(totalHeld)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stat 2 — Registered */}
        <Card className="rounded-xl border-border">
          <CardContent className="flex items-start gap-3 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="size-5 text-success" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                Registered
              </p>
              <p className="font-heading text-2xl font-bold tracking-tight text-success">
                {registeredCount}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stat 3 — Pending */}
        <Card className="rounded-xl border-border">
          <CardContent className="flex items-start gap-3 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="size-5 text-warning" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                Pending
              </p>
              <p className="font-heading text-2xl font-bold tracking-tight text-warning">
                {pendingCount}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stat 4 — Disputed */}
        <Card className="rounded-xl border-border">
          <CardContent className="flex items-start gap-3 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-error/10">
              <AlertCircle className="size-5 text-error" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                Disputed
              </p>
              <p className="font-heading text-2xl font-bold tracking-tight text-error">
                {disputedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenancy Deposits section header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
            Tenancy Deposits
          </h2>
          {deposits.length > 0 && (
            <Badge className="border-0 bg-brand-primary/10 text-brand-primary text-[11px] font-bold uppercase tracking-[0.08em]">
              {deposits.length} Total
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="size-3.5" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="size-3.5" />
            Export CSV
          </Button>
          <Button size="sm" className="text-xs" onClick={handleOpenCreate}>
            Register New Deposit
          </Button>
        </div>
      </div>

      {/* Deposit table */}
      <Card className="rounded-xl border-border">
        <div className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 pl-5">
                  Tenant &amp; Property
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                  Deposit Amount
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                  Scheme
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                  Registered
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                  Prescribed Info Sent
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    No deposit registrations found.
                  </TableCell>
                </TableRow>
              ) : (
                deposits.map((deposit) => (
                  <DepositTableRow
                    key={deposit.id}
                    deposit={deposit}
                    onEdit={handleOpenEdit}
                    onMarkRegistered={(id) => markRegisteredMutation.mutate(id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Protection Compliance Reminder */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border border-border bg-brand-primary/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/10">
              <Shield className="size-5 text-success" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-neutral-900">
                Protection Compliance Reminder
              </p>
              <p className="text-sm text-neutral-600 leading-relaxed">
                In the UK, you must protect a tenant&apos;s deposit within 30 days of
                receiving it. Failure to do so can result in penalties of up to 3 times
                the deposit amount. Register with a government-approved scheme to stay compliant.
              </p>
            </div>
          </div>
        </div>
        <Card className="rounded-xl border-border">
          <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
            <div className="flex size-9 items-center justify-center rounded-full bg-brand-primary/10">
              <Shield className="size-5 text-brand-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-neutral-900">Need Help?</p>
              <p className="text-xs text-neutral-500">
                Our compliance experts are available to help with deposit registration and dispute resolution.
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs">
              Open Support Ticket
            </Button>
          </CardContent>
        </Card>
      </div>

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

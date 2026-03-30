"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Calendar,
  PoundSterling,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Pencil,
  XCircle,
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Home,
} from "lucide-react";

import type { Tenancy, TenancyStatus } from "@/types/landlord";
import { TenancyStatusBadge, isTenancyExpired } from "@/components/landlord/TenancyStatusBadge";
import { TenancyForm } from "@/components/landlord/TenancyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// -- helpers ------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Periodic";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// -- Page ---------------------------------------------------------------------

export default function TenancyDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string; tenancyId: string }>();
  const [tenancy, setTenancy] = useState<Tenancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [ending, setEnding] = useState(false);

  const fetchTenancy = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${params.id}/tenancies?status=`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      const match = (json.data as Tenancy[]).find((t) => t.id === params.tenancyId);
      if (match) {
        setTenancy(match);
      } else {
        toast.error("Tenancy not found");
      }
    } catch {
      toast.error("Failed to load tenancy");
    } finally {
      setLoading(false);
    }
  }, [params.id, params.tenancyId]);

  useEffect(() => {
    fetchTenancy();
  }, [fetchTenancy]);

  async function handleEndTenancy() {
    if (!confirm("Are you sure you want to end this tenancy?")) return;
    setEnding(true);
    try {
      const res = await fetch(`/api/tenancies/${params.tenancyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to end tenancy");
      }
      toast.success("Tenancy ended");
      fetchTenancy();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setEnding(false);
    }
  }

  // -- Loading state ----------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <p className="text-sm">Loading tenancy...</p>
        </div>
      </div>
    );
  }

  if (!tenancy) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <XCircle className="size-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">Tenancy not found.</p>
        <Button variant="outline" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="mr-2 size-4" />
          Go back
        </Button>
      </div>
    );
  }

  // -- Edit mode --------------------------------------------------------------

  if (editing) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => setEditing(false)}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="size-3.5" />
            Back to Tenancy
          </button>
        </div>
        <h1 className="text-2xl font-bold font-heading tracking-tight">Edit Tenancy</h1>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <TenancyForm
              propertyId={params.id}
              mode="edit"
              tenancyId={params.tenancyId}
              defaultValues={{
                tenant_name: tenancy.tenant_name,
                tenant_email: tenancy.tenant_email ?? "",
                tenant_phone: tenancy.tenant_phone ?? "",
                lease_start_date: tenancy.lease_start_date,
                lease_end_date: tenancy.lease_end_date ?? "",
                rent_amount: tenancy.rent_amount,
                rent_frequency: tenancy.rent_frequency,
                deposit_amount: tenancy.deposit_amount ?? undefined,
                deposit_scheme: tenancy.deposit_scheme ?? "",
                notes: tenancy.notes ?? "",
              }}
              onSuccess={() => {
                setEditing(false);
                fetchTenancy();
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // -- Main view --------------------------------------------------------------

  const isActive = tenancy.status === "active" || tenancy.status === "ending_soon";
  const expired = isTenancyExpired(tenancy.status as TenancyStatus, tenancy.lease_end_date);
  const daysRemaining = daysUntil(tenancy.lease_end_date);
  const tenantInitials = tenancy.tenant_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => router.back()}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>
      </div>

      {/* Expired banner */}
      {expired && tenancy.lease_end_date && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/10 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              Tenancy expired on {formatDate(tenancy.lease_end_date)}
            </p>
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
              Please renew the lease or formally end the tenancy to keep your records up to date.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="shrink-0 text-xs border-red-200 dark:border-red-800/30 rounded-lg"
          >
            Renew
          </Button>
        </div>
      )}

      {/* Tenant hero card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="size-14 shrink-0 rounded-2xl bg-[color:var(--color-brand-primary-lighter)] dark:bg-[color:var(--color-brand-primary)]/20 text-[color:var(--color-brand-primary)] dark:text-emerald-400 flex items-center justify-center font-bold text-lg font-heading">
              {tenantInitials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold font-heading tracking-tight">
                  {tenancy.tenant_name}
                </h1>
                <TenancyStatusBadge
                  status={tenancy.status as TenancyStatus}
                  leaseEndDate={tenancy.lease_end_date}
                />
              </div>
              <div className="mt-1.5 flex flex-col gap-1">
                {tenancy.tenant_email && (
                  <a
                    href={`mailto:${tenancy.tenant_email}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="size-3.5" />
                    {tenancy.tenant_email}
                  </a>
                )}
                {tenancy.tenant_phone && (
                  <a
                    href={`tel:${tenancy.tenant_phone}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="size-3.5" />
                    {tenancy.tenant_phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            {(isActive || expired) && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="rounded-xl"
                >
                  <Pencil className="mr-2 size-3.5" />
                  {expired ? "Renew" : "Edit"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndTenancy}
                  disabled={ending}
                  className="rounded-xl"
                >
                  {ending ? (
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 size-3.5" />
                  )}
                  {ending ? "Ending..." : "End Tenancy"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Monthly Rent
          </p>
          <p className="mt-1.5 text-xl font-bold font-heading text-foreground">
            {formatGBP(tenancy.rent_amount)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground capitalize">
            {tenancy.rent_frequency}
          </p>
        </div>

        {tenancy.deposit_amount != null && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Deposit
            </p>
            <p className="mt-1.5 text-xl font-bold font-heading text-foreground">
              {formatGBP(tenancy.deposit_amount)}
            </p>
            {tenancy.deposit_scheme && (
              <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                {tenancy.deposit_scheme}
              </p>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Lease Start
          </p>
          <p className="mt-1.5 text-sm font-semibold text-foreground leading-snug">
            {formatDate(tenancy.lease_start_date)}
          </p>
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            daysRemaining !== null && daysRemaining <= 60 && daysRemaining > 0
              ? "border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/10"
              : expired
                ? "border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/10"
                : "border-slate-200 dark:border-slate-700 bg-card"
          }`}
        >
          <p
            className={`text-xs font-medium uppercase tracking-wide ${
              daysRemaining !== null && daysRemaining <= 60 && daysRemaining > 0
                ? "text-amber-600 dark:text-amber-400"
                : expired
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
            }`}
          >
            Lease End
          </p>
          <p
            className={`mt-1.5 text-sm font-semibold leading-snug ${
              daysRemaining !== null && daysRemaining <= 60 && daysRemaining > 0
                ? "text-amber-700 dark:text-amber-400"
                : expired
                  ? "text-red-700 dark:text-red-400"
                  : "text-foreground"
            }`}
          >
            {formatDate(tenancy.lease_end_date)}
          </p>
          {daysRemaining !== null && daysRemaining > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {daysRemaining} days remaining
            </p>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Tenancy details */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Home className="size-4 text-[color:var(--color-brand-primary)]" />
              Tenancy Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-0 text-sm">
              <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <dt className="text-muted-foreground flex items-center gap-2 shrink-0">
                  <User className="size-3.5" />
                  Tenant
                </dt>
                <dd className="font-medium text-foreground text-right">{tenancy.tenant_name}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <dt className="text-muted-foreground flex items-center gap-2 shrink-0">
                  <Calendar className="size-3.5" />
                  Lease Period
                </dt>
                <dd className="font-medium text-foreground text-right">
                  {formatDate(tenancy.lease_start_date)} –{" "}
                  {tenancy.lease_end_date ? formatDate(tenancy.lease_end_date) : "Periodic"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <dt className="text-muted-foreground flex items-center gap-2 shrink-0">
                  <PoundSterling className="size-3.5" />
                  Rent
                </dt>
                <dd className="font-medium text-foreground text-right">
                  {formatGBP(tenancy.rent_amount)} / {tenancy.rent_frequency}
                </dd>
              </div>
              {tenancy.deposit_amount != null && (
                <div className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground flex items-center gap-2 shrink-0">
                    <ShieldCheck className="size-3.5" />
                    Deposit
                  </dt>
                  <dd className="font-medium text-foreground text-right">
                    {formatGBP(tenancy.deposit_amount)}
                    {tenancy.deposit_scheme && (
                      <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">
                        ({tenancy.deposit_scheme})
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Documents & actions */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <FileText className="size-4 text-[color:var(--color-brand-primary)]" />
              Documents & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Manage documents and take actions for this tenancy.
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start rounded-xl text-sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="mr-2 size-4" />
                Edit Tenancy Details
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start rounded-xl text-sm"
                onClick={handleEndTenancy}
                disabled={ending}
              >
                {ending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 size-4" />
                )}
                {ending ? "Ending tenancy..." : "End Tenancy"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {tenancy.notes && (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tenancy.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Back button */}
      <div className="pb-4">
        <Button variant="outline" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  ShieldCheck,
  StickyNote,
  Banknote,
} from "lucide-react";

import type { Tenancy, TenancyStatus } from "@/types/landlord";
import { TenancyStatusBadge, isTenancyExpired } from "@/components/landlord/TenancyStatusBadge";
import { TenancyForm } from "@/components/landlord/TenancyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setEnding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading tenancy...</p>
      </div>
    );
  }

  if (!tenancy) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Tenancy not found</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit Tenancy</h1>
        <Card>
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

  const isActive = tenancy.status === "active" || tenancy.status === "ending_soon";
  const expired = isTenancyExpired(
    tenancy.status as TenancyStatus,
    tenancy.lease_end_date,
  );

  const rentFormatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(tenancy.rent_amount);

  const depositFormatted =
    tenancy.deposit_amount != null
      ? new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP",
          minimumFractionDigits: 0,
        }).format(tenancy.deposit_amount)
      : null;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {/* Eyebrow: status badge */}
          <div className="flex items-center gap-2">
            <TenancyStatusBadge
              status={tenancy.status as TenancyStatus}
              leaseEndDate={tenancy.lease_end_date}
            />
          </div>
          {/* Hero heading */}
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            {tenancy.tenant_name}
          </h1>
          {/* Contact subtitle */}
          {(tenancy.tenant_email || tenancy.tenant_phone) && (
            <p className="flex items-center gap-2 text-sm text-neutral-500">
              {tenancy.tenant_email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {tenancy.tenant_email}
                </span>
              )}
              {tenancy.tenant_email && tenancy.tenant_phone && (
                <span className="text-neutral-300">·</span>
              )}
              {tenancy.tenant_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {tenancy.tenant_phone}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 gap-2">
          {expired && (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                Renew
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndTenancy}
                disabled={ending}
              >
                {ending ? "Ending..." : "End Tenancy"}
              </Button>
            </>
          )}
          {isActive && !expired && (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndTenancy}
                disabled={ending}
              >
                {ending ? "Ending..." : "End Tenancy"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Expired tenancy warning banner */}
      {expired && tenancy.lease_end_date && (
        <div className="flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-error" />
          <div>
            <p className="text-sm font-medium text-error">
              Tenancy expired on{" "}
              {new Date(tenancy.lease_end_date).toLocaleDateString("en-GB")}
            </p>
            <p className="mt-1 text-xs text-error/70">
              This tenancy has passed its end date. Please renew the lease or
              formally end the tenancy to keep your records up to date.
            </p>
          </div>
        </div>
      )}

      {/* ── Top row: Rent hero + Tenancy Overview ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Rent hero card (dark green) */}
        <div className="flex flex-col justify-between rounded-xl bg-brand-primary-dark p-6 text-white shadow-md">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
              Rent Amount
            </p>
            <p className="mt-2 font-heading text-4xl font-bold tracking-tight">
              {rentFormatted}
            </p>
            <p className="mt-1 text-sm text-white/70">
              per {tenancy.rent_frequency}
            </p>
          </div>
          <div className="mt-6 border-t border-white/20 pt-4">
            <p className="text-xs text-white/50">Lease start</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {new Date(tenancy.lease_start_date).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>

        {/* Tenancy Overview stat tiles */}
        <div className="lg:col-span-2 flex flex-col justify-between rounded-xl border border-border bg-white p-6 shadow-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Tenancy Overview
            </p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {/* Start Date */}
            <div className="rounded-lg bg-surface p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Start Date
              </p>
              <p className="mt-1 text-base font-semibold text-neutral-800">
                {new Date(tenancy.lease_start_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">Fixed Term</p>
            </div>
            {/* End Date */}
            <div className="rounded-lg bg-surface p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                End Date
              </p>
              <p className="mt-1 text-base font-semibold text-neutral-800">
                {tenancy.lease_end_date
                  ? new Date(tenancy.lease_end_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Periodic"}
              </p>
              {tenancy.lease_end_date && (
                <p className="mt-0.5 text-xs text-neutral-400">
                  {expired ? "Expired" : "Active"}
                </p>
              )}
            </div>
            {/* Deposit Held */}
            <div className="rounded-lg bg-surface p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Deposit Held
              </p>
              <p className="mt-1 text-base font-semibold text-neutral-800">
                {depositFormatted ?? "—"}
              </p>
              {tenancy.deposit_scheme && (
                <p className="mt-0.5 text-xs text-neutral-400">
                  Protected by {tenancy.deposit_scheme}
                </p>
              )}
            </div>
          </div>
          {/* Rent frequency label row */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <p className="text-xs text-neutral-400">Rent Frequency</p>
            <p className="text-sm font-semibold capitalize text-neutral-700">
              {tenancy.rent_frequency}
            </p>
          </div>
        </div>
      </div>

      {/* ── Second row: Tenant Contact | Tenancy Details | Notes ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Tenant Contact */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <Mail className="size-4 text-neutral-400" />
              Tenant Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Tenant Name
              </p>
              <p className="mt-0.5 text-sm font-medium text-neutral-800">
                {tenancy.tenant_name}
              </p>
            </div>
            {tenancy.tenant_email && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  Email
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-neutral-800">
                  <Mail className="size-3.5 text-neutral-400" />
                  {tenancy.tenant_email}
                </p>
              </div>
            )}
            {tenancy.tenant_phone && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  Phone
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-neutral-800">
                  <Phone className="size-3.5 text-neutral-400" />
                  {tenancy.tenant_phone}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Dates */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <Calendar className="size-4 text-neutral-400" />
              Key Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Lease Start
              </p>
              <p className="mt-0.5 text-sm font-medium text-neutral-800">
                {new Date(tenancy.lease_start_date).toLocaleDateString("en-GB")}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Lease End
              </p>
              <p className="mt-0.5 text-sm font-medium text-neutral-800">
                {tenancy.lease_end_date
                  ? new Date(tenancy.lease_end_date).toLocaleDateString("en-GB")
                  : "Periodic"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Rent
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-neutral-800">
                <Banknote className="size-3.5 text-neutral-400" />
                {rentFormatted}/{tenancy.rent_frequency}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Deposit & Notes */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <ShieldCheck className="size-4 text-neutral-400" />
              Deposit &amp; Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenancy.deposit_amount != null && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  Deposit
                </p>
                <p className="mt-0.5 text-sm font-medium text-neutral-800">
                  {depositFormatted}
                  {tenancy.deposit_scheme && (
                    <span className="ml-1 text-xs text-neutral-400">
                      ({tenancy.deposit_scheme})
                    </span>
                  )}
                </p>
              </div>
            )}
            {tenancy.notes ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  Notes
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-neutral-700">
                  {tenancy.notes}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <StickyNote className="size-6 text-neutral-300" />
                <p className="mt-2 text-xs text-neutral-400">No notes added</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Footer actions ── */}
      <div className="flex gap-3 border-t border-border pt-4">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    </div>
  );
}

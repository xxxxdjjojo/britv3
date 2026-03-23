"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

import type { Tenancy, TenancyStatus } from "@/types/landlord";
import { TenancyStatusBadge, isTenancyExpired } from "@/components/landlord/TenancyStatusBadge";
import { TenancyForm } from "@/components/landlord/TenancyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {tenancy.tenant_name}
          </h1>
          <TenancyStatusBadge
            status={tenancy.status as TenancyStatus}
            leaseEndDate={tenancy.lease_end_date}
          />
        </div>
        <div className="flex gap-2">
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
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Tenancy expired on{" "}
              {new Date(tenancy.lease_end_date).toLocaleDateString("en-GB")}
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              This tenancy has passed its end date. Please renew the lease or
              formally end the tenancy to keep your records up to date.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tenancy Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Tenant Name</dt>
              <dd className="font-medium">{tenancy.tenant_name}</dd>
            </div>
            {tenancy.tenant_email && (
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="font-medium">{tenancy.tenant_email}</dd>
              </div>
            )}
            {tenancy.tenant_phone && (
              <div>
                <dt className="text-sm text-muted-foreground">Phone</dt>
                <dd className="font-medium">{tenancy.tenant_phone}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-muted-foreground">Lease Start</dt>
              <dd className="font-medium">
                {new Date(tenancy.lease_start_date).toLocaleDateString("en-GB")}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Lease End</dt>
              <dd className="font-medium">
                {tenancy.lease_end_date
                  ? new Date(tenancy.lease_end_date).toLocaleDateString("en-GB")
                  : "Periodic"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Rent</dt>
              <dd className="font-medium">
                {new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: "GBP",
                  minimumFractionDigits: 0,
                }).format(tenancy.rent_amount)}
                /{tenancy.rent_frequency}
              </dd>
            </div>
            {tenancy.deposit_amount != null && (
              <div>
                <dt className="text-sm text-muted-foreground">Deposit</dt>
                <dd className="font-medium">
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                    minimumFractionDigits: 0,
                  }).format(tenancy.deposit_amount)}
                  {tenancy.deposit_scheme && ` (${tenancy.deposit_scheme})`}
                </dd>
              </div>
            )}
            {tenancy.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-sm text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-wrap font-medium">{tenancy.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    </div>
  );
}

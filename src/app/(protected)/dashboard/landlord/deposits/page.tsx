import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { listDeposits } from "@/services/landlord/deposit-service";
import { DepositManagementClient } from "./DepositManagementClient";
import type { DepositRegistration } from "@/types/landlord";
import { Skeleton } from "@/components/ui/skeleton";

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

/**
 * 9.25 Deposit Management — Server Component.
 * Fetches deposits server-side, passes to client wrapper.
 * Client wrapper uses React Query with initialData for optimistic updates.
 */

function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
  const supabase = await createClient();

  let deposits: DepositWithTenancy[] = [];
  let activeTenancies: ActiveTenancy[] = [];

  try {
    // Fetch raw deposits from service
    const rawDeposits = await listDeposits(supabase);

    // Enrich with tenancy info — join tenancies table
    if (rawDeposits.length > 0) {
      const tenancyIds = rawDeposits.map((d) => d.tenancy_id);
      const { data: tenancyRows } = await supabase
        .from("tenancies")
        .select("id, tenant_name, property_id, properties(address_line_1, city)")
        .in("id", tenancyIds);

      type TenancyRow = {
        id: string;
        tenant_name: string;
        property_id: string;
        properties: { address_line_1: string; city: string } | null;
      };

      const tenancyMap = new Map<
        string,
        { tenant_name: string; property_address: string }
      >();

      for (const row of (tenancyRows ?? []) as unknown as TenancyRow[]) {
        const address = row.properties
          ? `${row.properties.address_line_1}, ${row.properties.city}`
          : "";
        tenancyMap.set(row.id, {
          tenant_name: row.tenant_name,
          property_address: address,
        });
      }

      deposits = rawDeposits.map((d) => ({
        ...d,
        tenancy: tenancyMap.get(d.tenancy_id) ?? {
          tenant_name: "Unknown tenant",
          property_address: "",
        },
      }));
    }
  } catch {
    // Silently fall back to empty data — client will retry via React Query
  }

  // Fetch active tenancies for the "Register New Deposit" form dropdown
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: tenancyRows } = await supabase
        .from("tenancies")
        .select("id, tenant_name, property_id")
        .eq("landlord_id", user.id)
        .in("status", ["active", "ending_soon"])
        .order("created_at", { ascending: false });

      activeTenancies = (tenancyRows ?? []) as ActiveTenancy[];
    }
  } catch {
    // Non-critical
  }

  const nowMs = new Date().getTime();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Deposit Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage tenancy deposit registrations
          </p>
        </div>
      </div>

      <DepositManagementClient
        initialData={deposits}
        activeTenancies={activeTenancies}
        serverTimestamp={nowMs}
      />
    </div>
  );
}

export default function DepositsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

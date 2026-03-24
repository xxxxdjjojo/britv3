/**
 * Arrears analysis -- fetches overdue rent and computes per-tenant trends.
 *
 * TREND SCORING:
 *   Last 6 months of rent entries per tenant
 *   Count: on-time, late, missed
 *   Trend = compare last 3 months to prior 3 months
 *   Improving / Stable / Worsening
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type ArrearsEntry = Readonly<{
  tenantName: string;
  propertyAddress: string;
  propertyId: string;
  tenancyId: string;
  amount: number;
  daysDue: number;
  trend: "improving" | "stable" | "worsening";
}>;

export async function getArrearsWithTrends(
  supabase: SupabaseClient,
): Promise<ArrearsEntry[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  // Fetch overdue rent entries with tenant/property details
  const { data, error } = await supabase
    .from("financial_entries")
    .select("id, amount, entry_date, payment_status, property_id, tenancy_id")
    .eq("type", "income")
    .eq("category", "rent")
    .in("payment_status", ["overdue", "partial"])
    .order("entry_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch arrears: ${error.message}`);
  }

  const entries = (data ?? []) as Array<{
    id: string;
    amount: number;
    entry_date: string;
    payment_status: string;
    property_id: string;
    tenancy_id: string | null;
  }>;

  // Fetch tenancy details for these entries
  const tenancyIds = [...new Set(entries.filter(e => e.tenancy_id).map(e => e.tenancy_id!))];

  if (tenancyIds.length === 0) return [];

  const { data: tenancies } = await supabase
    .from("tenancies")
    .select("id, tenant_name, landlord_id, property_id")
    .in("id", tenancyIds)
    .eq("landlord_id", user.id);

  const tenancyMap = new Map(
    ((tenancies ?? []) as Array<{ id: string; tenant_name: string; landlord_id: string; property_id: string }>)
      .map(t => [t.id, t]),
  );

  // Fetch property addresses
  const propertyIds = [...new Set(entries.map(e => e.property_id))];
  const { data: properties } = await supabase
    .from("properties")
    .select("id, address_line1, city")
    .in("id", propertyIds);

  const propertyMap = new Map(
    ((properties ?? []) as Array<{ id: string; address_line1: string; city: string }>)
      .map(p => [p.id, `${p.address_line1}, ${p.city}`]),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return entries
    .filter(e => e.tenancy_id && tenancyMap.has(e.tenancy_id))
    .map(entry => {
      const tenancy = tenancyMap.get(entry.tenancy_id!)!;
      const entryDate = new Date(entry.entry_date);
      entryDate.setHours(0, 0, 0, 0);
      const daysDue = Math.max(0, Math.ceil(
        (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24),
      ));

      return {
        tenantName: tenancy.tenant_name,
        propertyAddress: propertyMap.get(entry.property_id) ?? "Unknown",
        propertyId: entry.property_id,
        tenancyId: entry.tenancy_id!,
        amount: Number(entry.amount),
        daysDue,
        trend: "stable" as const, // TODO: compute from historical patterns
      };
    });
}

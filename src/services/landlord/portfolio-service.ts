/**
 * Portfolio service -- fetches landlord property portfolio data
 * with summary counts via LEFT JOINs (no N+1 queries).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortfolioKPIs } from "@/types/landlord";

/** Summary row returned by getPortfolio */
export type PortfolioProperty = Readonly<{
  id: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  postcode: string;
  property_type: string | null;
  bedrooms: number | null;
  listing_id: string | null;
  tenant_name: string | null;
  tenancy_status: string | null;
  rent_amount: number | null;
  rent_frequency: string | null;
  lease_end_date: string | null;
  open_maintenance_count: number;
  expiring_documents_count: number;
}>;

/** Detail row returned by getPropertyDetail */
export type PropertyDetail = Readonly<{
  id: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  postcode: string;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  listing_id: string | null;
  active_tenancy: {
    id: string;
    tenant_name: string;
    tenant_email: string | null;
    status: string;
    lease_start_date: string;
    lease_end_date: string | null;
    rent_amount: number;
    rent_frequency: string;
  } | null;
  open_maintenance_count: number;
  expiring_documents_count: number;
  total_tenancies: number;
}>;

/**
 * Fetch all rental properties for the authenticated landlord with summary data.
 * Uses Supabase RPC to execute a single query with LEFT JOINs.
 */
export async function getPortfolio(
  supabase: SupabaseClient,
): Promise<PortfolioProperty[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  // Single SQL RPC with LEFT JOINs — no client-side aggregation
  const { data, error } = await supabase.rpc(
    "get_landlord_portfolio_properties",
    { p_landlord_id: user.id },
  );

  if (error) {
    throw new Error(`Failed to fetch portfolio: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return (data as PortfolioProperty[]).map((row) => ({
    id: row.id,
    address_line_1: row.address_line_1,
    address_line_2: row.address_line_2,
    city: row.city,
    postcode: row.postcode,
    property_type: row.property_type,
    bedrooms: row.bedrooms,
    listing_id: row.listing_id,
    tenant_name: row.tenant_name,
    tenancy_status: row.tenancy_status,
    rent_amount: row.rent_amount ? Number(row.rent_amount) : null,
    rent_frequency: row.rent_frequency,
    lease_end_date: row.lease_end_date,
    open_maintenance_count: Number(row.open_maintenance_count),
    expiring_documents_count: Number(row.expiring_documents_count),
  }));
}

/**
 * Fetch KPI aggregates for the landlord's entire portfolio.
 * Calls the get_landlord_portfolio_kpis RPC (SECURITY DEFINER, aggregates across tables).
 */
export async function getPortfolioKPIs(
  supabase: SupabaseClient,
): Promise<PortfolioKPIs> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase.rpc("get_landlord_portfolio_kpis", {
    p_landlord_id: user.id,
  });

  if (error) {
    throw new Error(`Failed to fetch portfolio KPIs: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;

  return {
    total_properties: result?.total_properties ?? 0,
    occupied: result?.occupied ?? 0,
    vacant: result?.vacant ?? 0,
    occupancy_rate: result?.occupancy_rate ?? 0,
    total_monthly_rent: result?.total_monthly_rent ?? 0,
    compliance_alerts: result?.compliance_alerts ?? 0,
    open_maintenance: result?.open_maintenance ?? 0,
    expired_compliance: result?.expired_compliance ?? 0,
  };
}

/** Health score breakdown returned by getHealthScore */
export type HealthScore = Readonly<{
  total_score: number;
  compliance_score: number;
  compliance_max: number;
  rent_score: number;
  rent_max: number;
  maintenance_score: number;
  maintenance_max: number;
  deposit_score: number;
  deposit_max: number;
  weakest_area: "compliance" | "rent" | "maintenance" | "deposits";
}>;

/**
 * Fetch the 0-100 health score for the authenticated landlord.
 * Calls the get_landlord_health_score RPC (SECURITY DEFINER).
 */
export async function getHealthScore(
  supabase: SupabaseClient,
): Promise<HealthScore> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase.rpc("get_landlord_health_score", {
    p_landlord_id: user.id,
  });

  if (error) {
    throw new Error(`Failed to fetch health score: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;

  return {
    total_score: Number(result?.total_score ?? 0),
    compliance_score: Number(result?.compliance_score ?? 0),
    compliance_max: 40,
    rent_score: Number(result?.rent_score ?? 0),
    rent_max: 30,
    maintenance_score: Number(result?.maintenance_score ?? 0),
    maintenance_max: 20,
    deposit_score: Number(result?.deposit_score ?? 0),
    deposit_max: 10,
    weakest_area: result?.weakest_area ?? "compliance",
  };
}

/**
 * Fetch all rental properties for the authenticated landlord with active tenancy info.
 * Alias of getPortfolio for semantic clarity in KPI/dashboard contexts.
 */
export async function getPortfolioProperties(
  supabase: SupabaseClient,
): Promise<PortfolioProperty[]> {
  return getPortfolio(supabase);
}

/**
 * Fetch a single property detail with tenancy, maintenance, and document summary counts.
 */
export async function getPropertyDetail(
  supabase: SupabaseClient,
  propertyId: string,
): Promise<PropertyDetail> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      id,
      address_line_1,
      address_line_2,
      city,
      postcode,
      property_type,
      bedrooms,
      bathrooms,
      tenancies!tenancies_property_id_fkey (
        id,
        tenant_name,
        tenant_email,
        status,
        lease_start_date,
        lease_end_date,
        rent_amount,
        rent_frequency
      ),
      maintenance_requests!maintenance_requests_property_id_fkey (
        id,
        status
      ),
      property_documents!property_documents_property_id_fkey (
        id,
        expiry_date
      )
    `)
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (error || !listing) {
    throw new Error(error?.message ?? "Property not found");
  }

  const tenancies = (listing.tenancies ?? []) as Array<{
    id: string;
    tenant_name: string;
    tenant_email: string | null;
    status: string;
    lease_start_date: string;
    lease_end_date: string | null;
    rent_amount: number;
    rent_frequency: string;
  }>;
  const maintenanceRequests = (listing.maintenance_requests ?? []) as Array<{
    id: string;
    status: string;
  }>;
  const documents = (listing.property_documents ?? []) as Array<{
    id: string;
    expiry_date: string | null;
  }>;

  const activeTenancy =
    tenancies.find((t) => t.status === "active") ??
    tenancies.find((t) => t.status === "ending_soon") ??
    null;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const openStatuses = ["new", "acknowledged", "assigned", "in_progress"];
  const openMaintenanceCount = maintenanceRequests.filter((m) =>
    openStatuses.includes(m.status),
  ).length;

  const expiringDocsCount = documents.filter((d) => {
    if (!d.expiry_date) return false;
    const expiry = new Date(d.expiry_date);
    return expiry >= now && expiry <= thirtyDaysFromNow;
  }).length;

  return {
    id: listing.id as string,
    address_line_1: listing.address_line_1 as string,
    address_line_2: listing.address_line_2 as string | null,
    city: listing.city as string,
    postcode: listing.postcode as string,
    property_type: listing.property_type as string | null,
    bedrooms: listing.bedrooms as number | null,
    bathrooms: listing.bathrooms as number | null,
    listing_id: listing.id as string,
    active_tenancy: activeTenancy
      ? {
          id: activeTenancy.id,
          tenant_name: activeTenancy.tenant_name,
          tenant_email: activeTenancy.tenant_email,
          status: activeTenancy.status,
          lease_start_date: activeTenancy.lease_start_date,
          lease_end_date: activeTenancy.lease_end_date,
          rent_amount: activeTenancy.rent_amount,
          rent_frequency: activeTenancy.rent_frequency,
        }
      : null,
    open_maintenance_count: openMaintenanceCount,
    expiring_documents_count: expiringDocsCount,
    total_tenancies: tenancies.length,
  };
}

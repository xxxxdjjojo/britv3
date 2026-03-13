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

  // Use a single RPC call that performs LEFT JOINs server-side
  // Fallback: use Supabase query builder with embedded selects
  const { data: listings, error } = await supabase
    .from("listings")
    .select(`
      id,
      address_line_1,
      address_line_2,
      city,
      postcode,
      property_type,
      bedrooms,
      tenancies!tenancies_property_id_fkey (
        id,
        tenant_name,
        status,
        rent_amount,
        rent_frequency,
        lease_end_date
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
    .eq("user_id", user.id)
    .eq("listing_type", "rental");

  if (error) {
    throw new Error(`Failed to fetch portfolio: ${error.message}`);
  }

  if (!listings) {
    return [];
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return listings.map((listing) => {
    const tenancies = (listing.tenancies ?? []) as Array<{
      id: string;
      tenant_name: string;
      status: string;
      rent_amount: number;
      rent_frequency: string;
      lease_end_date: string | null;
    }>;
    const maintenanceRequests = (listing.maintenance_requests ?? []) as Array<{
      id: string;
      status: string;
    }>;
    const documents = (listing.property_documents ?? []) as Array<{
      id: string;
      expiry_date: string | null;
    }>;

    // Find active tenancy (prefer 'active', then 'ending_soon')
    const activeTenancy =
      tenancies.find((t) => t.status === "active") ??
      tenancies.find((t) => t.status === "ending_soon") ??
      null;

    // Count open maintenance requests
    const openStatuses = ["new", "acknowledged", "assigned", "in_progress"];
    const openMaintenanceCount = maintenanceRequests.filter((m) =>
      openStatuses.includes(m.status),
    ).length;

    // Count documents expiring within 30 days
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
      listing_id: listing.id as string,
      tenant_name: activeTenancy?.tenant_name ?? null,
      tenancy_status: activeTenancy?.status ?? null,
      rent_amount: activeTenancy?.rent_amount ?? null,
      rent_frequency: activeTenancy?.rent_frequency ?? null,
      lease_end_date: activeTenancy?.lease_end_date ?? null,
      open_maintenance_count: openMaintenanceCount,
      expiring_documents_count: expiringDocsCount,
    };
  });
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

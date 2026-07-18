import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPropertyDetail } from "@/services/landlord/portfolio-service";
import { getTenancies } from "@/services/landlord/tenancy-service";
import { getFinancialEntries } from "@/services/landlord/financial-service";
import { getDocuments } from "@/services/landlord/document-service";
import { getMaintenanceRequests } from "@/services/landlord/maintenance-service";
import { getListingAgents } from "@/services/listings/listing-agents-service";
import { AssignAgentManager } from "@/components/listings/AssignAgentManager";
import { MaintenanceList } from "@/components/landlord/MaintenanceList";
import DocumentList from "@/components/landlord/DocumentList";
import { FinancialSummary } from "@/components/landlord/FinancialSummary";
import type { TenancyStatus } from "@/types/landlord";
import { TenancyStatusBadge } from "@/components/landlord/TenancyStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata(props: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await props.params;
  return { title: `Property ${id} | Landlord Dashboard | TrueDeed` };
}

async function PropertyDetailContent(props: Readonly<{ id: string }>) {
  const supabase = await createClient();

  // Run all data fetches in parallel
  const [property, tenancies, financialEntries, documents, maintenanceRequests] =
    await Promise.all([
      getPropertyDetail(supabase, props.id).catch(() => null),
      getTenancies(supabase, props.id),
      getFinancialEntries(supabase, props.id),
      getDocuments(supabase, props.id),
      getMaintenanceRequests(supabase, props.id),
    ]);

  if (!property) {
    notFound();
  }

  // Fetch assigned agents only when a listing exists (agents key on listing_id).
  const listingAgents = property.listing_id
    ? await getListingAgents(supabase, property.listing_id).catch(() => [])
    : [];

  const fullAddress = [
    property.address_line_1,
    property.address_line_2,
    property.city,
    property.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const activeTenancy = property.active_tenancy;

  // Last 5 financial entries for overview
  const recentEntries = financialEntries.slice(0, 5);

  return (
    <div className="space-y-6 p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/landlord/properties" className="hover:text-brand-primary hover:underline">
          Properties
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-slate-900 dark:text-slate-100 font-medium">
          {property.address_line_1}
        </span>
      </nav>

      {/* Property Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {property.address_line_1}
          </h1>
          <p className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
            <MapPin className="size-4" />
            {fullAddress}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTenancy ? (
            <TenancyStatusBadge status={activeTenancy.status as TenancyStatus} />
          ) : (
            <Badge variant="secondary">Vacant</Badge>
          )}
          <Link
            href={`/dashboard/landlord/properties/${props.id}/listing`}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
          >
            Create Listing
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start border-b pb-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenancy">Tenancy</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Property details */}
              <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Property Details</h3>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {property.property_type && (
                    <div>
                      <dt className="text-xs font-medium uppercase text-slate-400">Type</dt>
                      <dd className="mt-1 text-sm font-semibold capitalize">{property.property_type}</dd>
                    </div>
                  )}
                  {property.bedrooms != null && (
                    <div>
                      <dt className="text-xs font-medium uppercase text-slate-400">Bedrooms</dt>
                      <dd className="mt-1 text-sm font-semibold">{property.bedrooms}</dd>
                    </div>
                  )}
                  {property.bathrooms != null && (
                    <div>
                      <dt className="text-xs font-medium uppercase text-slate-400">Bathrooms</dt>
                      <dd className="mt-1 text-sm font-semibold">{property.bathrooms}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">Tenancies</dt>
                    <dd className="mt-1 text-sm font-semibold">{property.total_tenancies}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">Open Maintenance</dt>
                    <dd className="mt-1 text-sm font-semibold">{property.open_maintenance_count}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">Expiring Docs</dt>
                    <dd className="mt-1 text-sm font-semibold">{property.expiring_documents_count}</dd>
                  </div>
                </dl>
              </div>

              {/* Recent financial entries */}
              {recentEntries.length > 0 && (
                <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Recent Financials</h3>
                  <div className="divide-y">
                    {recentEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium capitalize">{entry.category.replace(/_/g, " ")}</p>
                          <p className="text-xs text-slate-500">{entry.entry_date}</p>
                        </div>
                        <span className={`text-sm font-bold ${entry.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                          {entry.type === "expense" ? "-" : "+"}£{entry.amount.toLocaleString("en-GB")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Current Tenancy sidebar */}
            <div className="space-y-4">
              <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Current Tenancy</h3>
                {activeTenancy ? (
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs font-medium uppercase text-slate-400">Tenant</dt>
                      <dd className="mt-1 text-sm font-semibold">{activeTenancy.tenant_name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-slate-400">Rent</dt>
                      <dd className="mt-1 text-sm font-semibold">
                        £{activeTenancy.rent_amount.toLocaleString("en-GB")}/{activeTenancy.rent_frequency}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-slate-400">Lease Start</dt>
                      <dd className="mt-1 text-sm">
                        {new Date(activeTenancy.lease_start_date).toLocaleDateString("en-GB")}
                      </dd>
                    </div>
                    {activeTenancy.lease_end_date && (
                      <div>
                        <dt className="text-xs font-medium uppercase text-slate-400">Lease End</dt>
                        <dd className="mt-1 text-sm">
                          {new Date(activeTenancy.lease_end_date).toLocaleDateString("en-GB")}
                        </dd>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/landlord/properties/${props.id}/tenancies`}
                      className="mt-2 inline-flex text-sm font-bold text-brand-primary hover:underline"
                    >
                      View all tenancies
                    </Link>
                  </dl>
                ) : (
                  <div className="text-sm text-slate-500">
                    <p>No active tenancy.</p>
                    <Link
                      href={`/dashboard/landlord/properties/${props.id}/tenancies`}
                      className="mt-2 inline-flex font-bold text-brand-primary hover:underline"
                    >
                      Add tenancy
                    </Link>
                  </div>
                )}
              </div>

              {/* Estate agent assignment */}
              {property.listing_id ? (
                <AssignAgentManager
                  listingId={property.listing_id}
                  initialAgents={listingAgents}
                />
              ) : (
                <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                  Create a listing to assign an estate agent.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tenancy Tab */}
        <TabsContent value="tenancy" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Tenancy History ({tenancies.length})</h3>
              <Link
                href={`/dashboard/landlord/properties/${props.id}/tenancies`}
                className="text-sm font-bold text-brand-primary hover:underline"
              >
                Manage tenancies
              </Link>
            </div>
            {tenancies.length === 0 ? (
              <div className="rounded-xl border border-dashed p-12 text-center text-slate-500">
                No tenancies yet.
              </div>
            ) : (
              <div className="divide-y rounded-xl border bg-white dark:border-slate-800 dark:bg-slate-900">
                {tenancies.map((tenancy) => (
                  <Link
                    key={tenancy.id}
                    href={`/dashboard/landlord/properties/${props.id}/tenancies/${tenancy.id}`}
                    className="flex items-center justify-between p-4 transition-colors hover:bg-surface dark:hover:bg-slate-800"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{tenancy.tenant_name}</p>
                      <p className="text-sm text-slate-500">
                        £{tenancy.rent_amount.toLocaleString("en-GB")}/{tenancy.rent_frequency} &bull;{" "}
                        {new Date(tenancy.lease_start_date).toLocaleDateString("en-GB")}
                        {tenancy.lease_end_date
                          ? ` → ${new Date(tenancy.lease_end_date).toLocaleDateString("en-GB")}`
                          : " (ongoing)"}
                      </p>
                    </div>
                    <TenancyStatusBadge status={tenancy.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="mt-6">
          <FinancialSummary propertyId={props.id} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Documents ({documents.length})</h3>
              <Link
                href={`/dashboard/landlord/properties/${props.id}/documents`}
                className="text-sm font-bold text-brand-primary hover:underline"
              >
                Manage documents
              </Link>
            </div>
            <DocumentList documents={documents} />
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                Maintenance Requests ({maintenanceRequests.length})
              </h3>
              <Link
                href={`/dashboard/landlord/properties/${props.id}/maintenance`}
                className="text-sm font-bold text-brand-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <MaintenanceList requests={maintenanceRequests} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PropertyDetailSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default async function PropertyDetailPage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const { id } = await props.params;

  return (
    <Suspense fallback={<PropertyDetailSkeleton />}>
      <PropertyDetailContent id={id} />
    </Suspense>
  );
}

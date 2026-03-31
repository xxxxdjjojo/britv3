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
  return { title: `Property ${id} | Landlord Dashboard | Britestate` };
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
    <div className="space-y-6 p-6 md:p-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/dashboard/landlord/properties" className="hover:text-brand-primary hover:underline">
          Properties
        </Link>
        <ChevronRight className="size-4" />
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {property.address_line_1}
        </span>
      </nav>

      {/* Property Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {property.address_line_1}
          </h1>
          <p className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500">
            <MapPin className="size-4" />
            {fullAddress}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTenancy ? (
            <TenancyStatusBadge status={activeTenancy.status as TenancyStatus} />
          ) : (
            <Badge variant="secondary">Vacant</Badge>
          )}
          <Link
            href={`/dashboard/landlord/properties/${props.id}/listing`}
            aria-label="Create a listing for this property"
            className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light"
          >
            Create Listing
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start border-b border-neutral-200 pb-0 dark:border-neutral-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenancy">Tenancy</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-5">
              {/* Property details */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="font-heading mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Property Details</h3>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {property.property_type && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">Type</dt>
                      <dd className="mt-1 text-sm font-semibold capitalize text-neutral-900 dark:text-neutral-100">{property.property_type}</dd>
                    </div>
                  )}
                  {property.bedrooms != null && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">Bedrooms</dt>
                      <dd className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{property.bedrooms}</dd>
                    </div>
                  )}
                  {property.bathrooms != null && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">Bathrooms</dt>
                      <dd className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{property.bathrooms}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">Tenancies</dt>
                    <dd className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{property.total_tenancies}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">Open Maintenance</dt>
                    <dd className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{property.open_maintenance_count}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">Expiring Docs</dt>
                    <dd className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{property.expiring_documents_count}</dd>
                  </div>
                </dl>
              </div>

              {/* Recent financial entries */}
              {recentEntries.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <h3 className="font-heading mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recent Financials</h3>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {recentEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium capitalize text-neutral-900 dark:text-neutral-100">{entry.category.replace(/_/g, " ")}</p>
                          <p className="text-xs text-neutral-500">{entry.entry_date}</p>
                        </div>
                        <span className={`text-sm font-semibold ${entry.type === "income" ? "text-success" : "text-error"}`}>
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
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="font-heading mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Current Tenancy</h3>
                {activeTenancy ? (
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">Tenant</dt>
                      <dd className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{activeTenancy.tenant_name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">Rent</dt>
                      <dd className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        £{activeTenancy.rent_amount.toLocaleString("en-GB")}/{activeTenancy.rent_frequency}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">Lease Start</dt>
                      <dd className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                        {new Date(activeTenancy.lease_start_date).toLocaleDateString("en-GB")}
                      </dd>
                    </div>
                    {activeTenancy.lease_end_date && (
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">Lease End</dt>
                        <dd className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                          {new Date(activeTenancy.lease_end_date).toLocaleDateString("en-GB")}
                        </dd>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/landlord/properties/${props.id}/tenancies`}
                      className="mt-3 inline-flex text-sm font-semibold text-brand-primary hover:underline"
                    >
                      View all tenancies
                    </Link>
                  </dl>
                ) : (
                  <div className="text-sm text-neutral-500">
                    <p>No active tenancy.</p>
                    <Link
                      href={`/dashboard/landlord/properties/${props.id}/tenancies`}
                      className="mt-2 inline-flex font-semibold text-brand-primary hover:underline"
                    >
                      Add tenancy
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tenancy Tab */}
        <TabsContent value="tenancy" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-neutral-900 dark:text-neutral-100">Tenancy History ({tenancies.length})</h3>
              <Link
                href={`/dashboard/landlord/properties/${props.id}/tenancies`}
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                Manage tenancies
              </Link>
            </div>
            {tenancies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-neutral-500 dark:border-neutral-700">
                No tenancies yet.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:divide-neutral-800">
                {tenancies.map((tenancy) => (
                  <Link
                    key={tenancy.id}
                    href={`/dashboard/landlord/properties/${props.id}/tenancies/${tenancy.id}`}
                    className="flex items-center justify-between p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">{tenancy.tenant_name}</p>
                      <p className="text-sm text-neutral-500">
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
              <h3 className="font-heading font-semibold text-neutral-900 dark:text-neutral-100">Documents ({documents.length})</h3>
              <Link
                href={`/dashboard/landlord/properties/${props.id}/documents`}
                className="text-sm font-semibold text-brand-primary hover:underline"
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
              <h3 className="font-heading font-semibold text-neutral-900 dark:text-neutral-100">
                Maintenance Requests ({maintenanceRequests.length})
              </h3>
              <Link
                href={`/dashboard/landlord/properties/${props.id}/maintenance`}
                className="text-sm font-semibold text-brand-primary hover:underline"
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

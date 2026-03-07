import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPropertyDetail } from "@/services/landlord/portfolio-service";
import { TenancyStatusBadge } from "@/components/landlord/TenancyStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TenancyStatus } from "@/types/landlord";

export const metadata = {
  title: "Property Overview | Britestate",
};

export default async function PropertyOverviewPage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const property = await getPropertyDetail(supabase, id);

  const address = [property.address_line_1, property.address_line_2]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{address}</h1>
        <p className="text-muted-foreground">
          {property.city}, {property.postcode}
        </p>
      </div>

      {/* Property info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">
              {property.property_type ?? "Not specified"}
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Bedrooms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {property.bedrooms ?? "-"}
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Open Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {property.open_maintenance_count}
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Expiring Docs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold ${property.expiring_documents_count > 0 ? "text-amber-600" : ""}`}>
              {property.expiring_documents_count}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active tenancy summary */}
      <Card>
        <CardHeader>
          <CardTitle>Active Tenancy</CardTitle>
        </CardHeader>
        <CardContent>
          {property.active_tenancy ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Tenant</p>
                <p className="font-medium">{property.active_tenancy.tenant_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <TenancyStatusBadge status={property.active_tenancy.status as TenancyStatus} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rent</p>
                <p className="font-medium">
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                    minimumFractionDigits: 0,
                  }).format(property.active_tenancy.rent_amount)}
                  /{property.active_tenancy.rent_frequency}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lease End</p>
                <p className="font-medium">
                  {property.active_tenancy.lease_end_date
                    ? new Date(property.active_tenancy.lease_end_date).toLocaleDateString("en-GB")
                    : "Periodic"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No active tenancy</p>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={`/dashboard/landlord/properties/${id}/tenancies`}
          className="rounded-lg border p-4 text-center transition-colors hover:bg-muted"
        >
          <p className="font-medium">Tenancies</p>
          <p className="text-sm text-muted-foreground">{property.total_tenancies} total</p>
        </Link>
        <Link
          href={`/dashboard/landlord/properties/${id}/maintenance`}
          className="rounded-lg border p-4 text-center transition-colors hover:bg-muted"
        >
          <p className="font-medium">Maintenance</p>
          <p className="text-sm text-muted-foreground">{property.open_maintenance_count} open</p>
        </Link>
        <Link
          href={`/dashboard/landlord/properties/${id}/financials`}
          className="rounded-lg border p-4 text-center transition-colors hover:bg-muted"
        >
          <p className="font-medium">Financials</p>
          <p className="text-sm text-muted-foreground">Income & expenses</p>
        </Link>
        <Link
          href={`/dashboard/landlord/properties/${id}/documents`}
          className="rounded-lg border p-4 text-center transition-colors hover:bg-muted"
        >
          <p className="font-medium">Documents</p>
          <p className="text-sm text-muted-foreground">{property.expiring_documents_count} expiring</p>
        </Link>
      </div>
    </div>
  );
}

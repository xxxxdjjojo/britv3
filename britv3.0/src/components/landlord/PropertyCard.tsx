import Link from "next/link";
import type { PortfolioProperty } from "@/services/landlord/portfolio-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Format a number as GBP currency.
 */
function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PropertyCard(
  props: Readonly<{ property: PortfolioProperty }>,
) {
  const p = props.property;
  const isOccupied = p.tenancy_status === "active" || p.tenancy_status === "ending_soon";
  const hasExpiringDocs = p.expiring_documents_count > 0;

  return (
    <Link href={`/dashboard/landlord/properties/${p.id}/overview`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-start justify-between gap-2">
            <span className="truncate">{p.address_line_1}</span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isOccupied
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400"
              }`}
            >
              {isOccupied ? "Occupied" : "Vacant"}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {p.city}, {p.postcode}
          </p>

          {isOccupied && p.tenant_name && (
            <div className="text-sm">
              <span className="text-muted-foreground">Tenant:</span>{" "}
              <span className="font-medium">{p.tenant_name}</span>
            </div>
          )}

          {p.rent_amount != null && (
            <div className="text-sm">
              <span className="text-muted-foreground">Rent:</span>{" "}
              <span className="font-medium">
                {formatGBP(p.rent_amount)}/{p.rent_frequency ?? "month"}
              </span>
            </div>
          )}

          {p.lease_end_date && (
            <div className="text-sm">
              <span className="text-muted-foreground">Lease ends:</span>{" "}
              <span>{new Date(p.lease_end_date).toLocaleDateString("en-GB")}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            {p.open_maintenance_count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {p.open_maintenance_count} maintenance
              </span>
            )}

            {hasExpiringDocs && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {p.expiring_documents_count} expiring doc{p.expiring_documents_count > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

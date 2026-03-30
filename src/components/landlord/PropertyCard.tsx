import Link from "next/link";
import { MapPin, Wrench, AlertTriangle } from "lucide-react";
import type { PortfolioProperty } from "@/services/landlord/portfolio-service";
import { isTenancyExpired } from "@/components/landlord/TenancyStatusBadge";
import type { TenancyStatus } from "@/types/landlord";

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
  const expired = isTenancyExpired(
    (p.tenancy_status ?? "ended") as TenancyStatus,
    p.lease_end_date,
  );

  const statusBadge = expired
    ? { label: "Expired", className: "bg-error-light text-error" }
    : isOccupied
      ? { label: "Occupied", className: "bg-success-light text-success" }
      : { label: "Vacant", className: "bg-neutral-100 text-neutral-600" };

  return (
    <Link
      href={`/dashboard/landlord/properties/${p.id}/overview`}
      aria-label={`View property ${p.address_line_1}`}
      className="group block bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden transition-shadow hover:shadow-md dark:bg-neutral-900 dark:border-neutral-800"
    >
      {/* Property image placeholder */}
      <div className="h-32 bg-brand-primary/10 flex items-center justify-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-brand-primary/20">
          <MapPin className="size-6 text-brand-primary" />
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-neutral-900 truncate dark:text-neutral-100 group-hover:text-brand-primary transition-colors">
              {p.address_line_1}
            </h3>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {p.city}, {p.postcode}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Expired tenancy warning */}
        {expired && p.lease_end_date && (
          <div className="rounded-lg border border-error/20 bg-error-light px-3 py-2 text-xs text-error">
            Tenancy expired {new Date(p.lease_end_date).toLocaleDateString("en-GB")}. Renew or end.
          </div>
        )}

        <div className="space-y-1.5">
          {isOccupied && p.tenant_name && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{p.tenant_name}</span>
            </p>
          )}

          {p.rent_amount != null && (
            <p className="text-sm">
              <span className="font-heading font-semibold text-neutral-900 dark:text-neutral-100">
                {formatGBP(p.rent_amount)}
              </span>
              <span className="text-neutral-500">/{p.rent_frequency ?? "month"}</span>
            </p>
          )}

          {p.lease_end_date && (
            <p className="text-xs text-neutral-500">
              Lease ends: {new Date(p.lease_end_date).toLocaleDateString("en-GB")}
            </p>
          )}
        </div>

        {(p.open_maintenance_count > 0 || hasExpiringDocs) && (
          <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            {p.open_maintenance_count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-2 py-0.5 text-xs font-medium text-brand-accent">
                <Wrench className="size-3" />
                {p.open_maintenance_count}
              </span>
            )}
            {hasExpiringDocs && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning-light px-2 py-0.5 text-xs font-medium text-warning">
                <AlertTriangle className="size-3" />
                {p.expiring_documents_count} doc{p.expiring_documents_count > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

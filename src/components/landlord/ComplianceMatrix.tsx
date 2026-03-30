"use client";

import Link from "next/link";
import { Upload, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryMeta } from "@/lib/compliance-constants";
import { getDaysUntil } from "@/lib/date-utils";
import { ComplianceCountdownBadge } from "@/components/landlord/ComplianceCountdownBadge";
import type { MatrixData, MatrixCell } from "@/services/landlord/compliance-matrix-service";
import { Badge } from "@/components/ui/badge";

type ComplianceMatrixProps = Readonly<{
  data: MatrixData;
}>;

const STATUS_CELL_STYLES: Record<string, string> = {
  valid: "bg-success-light/30 dark:bg-success/10",
  expiring: "bg-warning-light/40 dark:bg-warning/10",
  expired: "bg-error-light/40 dark:bg-error/10",
  missing: "bg-muted/30",
};

function StatusIcon({ status }: Readonly<{ status: string }>) {
  switch (status) {
    case "valid":
      return <CheckCircle2 className="size-4 text-success" aria-hidden="true" />;
    case "expiring":
      return <AlertTriangle className="size-4 text-warning" aria-hidden="true" />;
    case "expired":
      return <XCircle className="size-4 text-error" aria-hidden="true" />;
    default:
      return null;
  }
}

function MatrixCellContent({ cell }: Readonly<{ cell: MatrixCell }>) {
  if (cell.status === "missing") {
    return (
      <Link
        href={`/dashboard/landlord/compliance/upload?category=${cell.category}`}
        className="flex flex-col items-center gap-1 text-muted-foreground hover:text-brand-primary transition-colors"
      >
        <Upload className="size-4" />
        <span className="text-[10px]">Upload</span>
      </Link>
    );
  }

  const days = cell.expiryDate ? getDaysUntil(cell.expiryDate) : null;

  return (
    <div className="flex flex-col items-center gap-1">
      <StatusIcon status={cell.status} />
      {days !== null ? (
        <ComplianceCountdownBadge daysUntilExpiry={days} />
      ) : (
        <span className="text-[10px] font-medium text-success">Valid</span>
      )}
    </div>
  );
}

export function ComplianceMatrix({ data }: ComplianceMatrixProps) {
  if (data.properties.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">No properties in your portfolio yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Property
            </th>
            {data.categories.map((cat) => {
              const meta = getCategoryMeta(cat);
              return (
                <th
                  key={cat}
                  className="whitespace-nowrap px-3 py-3 text-center font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-1">
                    {meta && (
                      <meta.icon className="size-4 text-muted-foreground" />
                    )}
                    <span>{meta?.label ?? cat}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.properties.map((property) => (
            <tr
              key={property.propertyId}
              className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
            >
              <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium">
                <div className="flex items-center gap-2">
                  <span className="max-w-[200px] truncate text-foreground">
                    {property.propertyAddress}
                  </span>
                  {property.isHmo && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-[10px] font-semibold uppercase"
                    >
                      HMO
                    </Badge>
                  )}
                </div>
              </td>
              {data.categories.map((cat) => {
                const cell = property.cells.find((c) => c.category === cat);
                if (!cell) return <td key={cat} className="px-3 py-3" />;
                return (
                  <td
                    key={cat}
                    className={cn(
                      "px-3 py-3 text-center",
                      STATUS_CELL_STYLES[cell.status],
                    )}
                  >
                    <MatrixCellContent cell={cell} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

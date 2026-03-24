"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryMeta } from "@/lib/compliance-constants";
import { getDaysUntil } from "@/lib/date-utils";
import { ComplianceCountdownBadge } from "@/components/landlord/ComplianceCountdownBadge";
import type { MatrixData, MatrixCell } from "@/services/landlord/compliance-matrix-service";
import { Badge } from "@/components/ui/badge";

type ComplianceMatrixProps = Readonly<{
  data: MatrixData;
}>;

const STATUS_STYLES: Record<string, string> = {
  valid: "bg-emerald-50 dark:bg-emerald-900/10",
  expiring: "bg-amber-50 dark:bg-amber-900/10",
  expired: "bg-red-50 dark:bg-red-900/10",
  missing: "bg-slate-50 dark:bg-slate-800/50",
};

function MatrixCellContent({ cell, propertyId }: Readonly<{ cell: MatrixCell; propertyId: string }>) {
  if (cell.status === "missing") {
    return (
      <Link
        href={`/dashboard/landlord/compliance/upload?category=${cell.category}`}
        className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#1B4D3E]"
      >
        <Upload className="size-4" />
        <span className="text-[10px]">Upload</span>
      </Link>
    );
  }

  const days = cell.expiryDate ? getDaysUntil(cell.expiryDate) : null;

  return (
    <div className="flex flex-col items-center gap-1">
      {days !== null ? (
        <ComplianceCountdownBadge daysUntilExpiry={days} />
      ) : (
        <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Valid
        </Badge>
      )}
    </div>
  );
}

export function ComplianceMatrix({ data }: ComplianceMatrixProps) {
  if (data.properties.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center dark:bg-slate-900">
        <p className="text-muted-foreground">No properties in your portfolio yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50 dark:bg-slate-800/50">
            <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left font-semibold dark:bg-slate-800/50">
              Property
            </th>
            {data.categories.map((cat) => {
              const meta = getCategoryMeta(cat);
              return (
                <th key={cat} className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                  <div className="flex flex-col items-center gap-1">
                    {meta && <meta.icon className="size-4 text-slate-500" />}
                    <span className="text-xs">{meta?.label ?? cat}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.properties.map((property) => (
            <tr key={property.propertyId} className="border-b last:border-b-0">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-[200px]">{property.propertyAddress}</span>
                  {property.isHmo && (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">HMO</Badge>
                  )}
                </div>
              </td>
              {data.categories.map((cat) => {
                const cell = property.cells.find((c) => c.category === cat);
                if (!cell) return <td key={cat} className="px-3 py-3" />;
                return (
                  <td
                    key={cat}
                    className={cn("px-3 py-3 text-center", STATUS_STYLES[cell.status])}
                  >
                    <MatrixCellContent cell={cell} propertyId={property.propertyId} />
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

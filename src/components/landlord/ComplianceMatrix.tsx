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
  valid: "bg-success/5",
  expiring: "bg-warning/5",
  expired: "bg-error/5",
  missing: "bg-surface",
};

const LEGEND = [
  { label: "Valid", dot: "bg-success" },
  { label: "Expiring", dot: "bg-warning" },
  { label: "Expired", dot: "bg-error" },
] as const;

function MatrixCellContent({ cell }: Readonly<{ cell: MatrixCell }>) {
  if (cell.status === "missing") {
    return (
      <Link
        href={`/dashboard/landlord/compliance/upload?category=${cell.category}`}
        className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-brand-primary"
      >
        <Upload className="size-4" />
        <span className="text-[10px] font-medium uppercase tracking-wide">Upload</span>
      </Link>
    );
  }

  const days = cell.expiryDate ? getDaysUntil(cell.expiryDate) : null;

  return (
    <div className="flex flex-col items-center gap-1">
      {days !== null ? (
        <ComplianceCountdownBadge daysUntilExpiry={days} />
      ) : (
        <Badge className="border-0 bg-success/10 text-success">Valid</Badge>
      )}
    </div>
  );
}

export function ComplianceMatrix({ data }: ComplianceMatrixProps) {
  if (data.properties.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-12 text-center dark:bg-slate-900">
        <p className="text-muted-foreground">No properties in your portfolio yet.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white dark:bg-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="font-heading text-lg font-bold tracking-tight text-brand-primary">
          Property Portfolio Matrix
        </h2>
        <ul className="flex items-center gap-4">
          {LEGEND.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", item.dot)} aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="sticky left-0 z-10 bg-surface px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Property
              </th>
              {data.categories.map((cat) => {
                const meta = getCategoryMeta(cat);
                return (
                  <th
                    key={cat}
                    className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.06em] whitespace-nowrap text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {meta && <meta.icon className="size-4 text-muted-foreground" />}
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
                className="border-b border-border last:border-b-0 transition-colors hover:bg-surface/60"
              >
                <td className="sticky left-0 z-10 border-l-2 border-l-brand-primary bg-white px-5 py-4 font-medium dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="max-w-[200px] truncate text-brand-primary-dark">
                      {property.propertyAddress}
                    </span>
                    {property.isHmo && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        HMO
                      </Badge>
                    )}
                  </div>
                </td>
                {data.categories.map((cat) => {
                  const cell = property.cells.find((c) => c.category === cat);
                  if (!cell) return <td key={cat} className="px-3 py-4" />;
                  return (
                    <td
                      key={cat}
                      className={cn("px-3 py-4 text-center", STATUS_STYLES[cell.status])}
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
    </section>
  );
}

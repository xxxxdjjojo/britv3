"use client";

import Link from "next/link";
import { FlameKindling, Zap, Leaf, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// -- Types -------------------------------------------------------------------

export type CertificateCategory =
  | "gas_safety"
  | "electrical_eicr"
  | "epc"
  | "deposit_protection";

type CertificateStatusTileProps = Readonly<{
  category: CertificateCategory;
  totalProperties: number;
  expired: number;
  expiringSoon: number;
  valid: number;
}>;

// -- Category metadata -------------------------------------------------------

const CATEGORY_META: Record<
  CertificateCategory,
  { label: string; icon: React.ElementType; description: string }
> = {
  gas_safety: {
    label: "Gas Safety",
    icon: FlameKindling,
    description: "Annual CP12 certificate",
  },
  electrical_eicr: {
    label: "Electrical (EICR)",
    icon: Zap,
    description: "Every 5 years or on tenancy change",
  },
  epc: {
    label: "Energy Performance",
    icon: Leaf,
    description: "10-year cert, minimum E rating",
  },
  deposit_protection: {
    label: "Deposit Protection",
    icon: Shield,
    description: "Must register within 30 days",
  },
};

// -- Component ---------------------------------------------------------------

export default function CertificateStatusTile({
  category,
  totalProperties,
  expired,
  expiringSoon,
  valid,
}: CertificateStatusTileProps) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  const hasExpired = expired > 0;
  const hasExpiringSoon = !hasExpired && expiringSoon > 0;
  const isAllCompliant = !hasExpired && !hasExpiringSoon;

  // Border colour based on urgency
  const borderClass = hasExpired
    ? "border-error"
    : hasExpiringSoon
      ? "border-warning"
      : "border-success";

  // Total documents tracked
  const total = expired + expiringSoon + valid;

  return (
    <Link
      href={`/dashboard/landlord/compliance/alerts?category=${category}`}
      className="block transition-shadow hover:shadow-md"
    >
      <Card className={`h-full border-2 ${borderClass}`}>
        <CardContent className="p-5">
          {/* Header row */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  {meta.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {meta.description}
                </p>
              </div>
            </div>

            {/* Status pill */}
            {hasExpired && (
              <Badge className="shrink-0 border-0 bg-error-light text-error">
                {expired} expired
              </Badge>
            )}
            {hasExpiringSoon && (
              <Badge className="shrink-0 border-0 bg-warning-light text-warning">
                {expiringSoon} expiring soon
              </Badge>
            )}
            {isAllCompliant && (
              <Badge className="shrink-0 border-0 bg-success-light text-success">
                All compliant
              </Badge>
            )}
          </div>

          {/* Count breakdown */}
          <div className="mb-3 grid grid-cols-3 gap-1 text-center">
            <div>
              <p className="text-lg font-bold text-error">{expired}</p>
              <p className="text-[10px] text-muted-foreground">Expired</p>
            </div>
            <div>
              <p className="text-lg font-bold text-warning">{expiringSoon}</p>
              <p className="text-[10px] text-muted-foreground">Expiring</p>
            </div>
            <div>
              <p className="text-lg font-bold text-success">{valid}</p>
              <p className="text-[10px] text-muted-foreground">Valid</p>
            </div>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
              {expired > 0 && (
                <div
                  className="bg-error"
                  style={{ width: `${(expired / total) * 100}%` }}
                />
              )}
              {expiringSoon > 0 && (
                <div
                  className="bg-warning"
                  style={{ width: `${(expiringSoon / total) * 100}%` }}
                />
              )}
              {valid > 0 && (
                <div
                  className="bg-success"
                  style={{ width: `${(valid / total) * 100}%` }}
                />
              )}
            </div>
          )}

          {/* Footer */}
          <p className="mt-2 text-xs text-muted-foreground">
            {totalProperties} {totalProperties === 1 ? "property" : "properties"} in portfolio
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

import { Receipt } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = Readonly<{
  band: string | null;
  estimatedAnnual?: number | null;
  localAuthority?: string | null;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CouncilTaxWidget({
  band,
  estimatedAnnual,
  localAuthority,
}: Props) {
  if (!band) {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium">Council Tax</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Council tax information unavailable.
        </p>
      </div>
    );
  }

  const monthly =
    estimatedAnnual != null ? Math.round(estimatedAnnual / 12) : null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium">Council Tax</p>
        </div>
        {/* Band badge */}
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-foreground">
          Band {band}
        </span>
      </div>

      {/* Cost breakdown */}
      {estimatedAnnual != null && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Per year</p>
            <p className="text-base font-semibold tabular-nums">
              {formatCurrency(estimatedAnnual)}
            </p>
          </div>
          {monthly != null && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Per month</p>
              <p className="text-base font-semibold tabular-nums">
                {formatCurrency(monthly)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Local authority */}
      {localAuthority && (
        <p className="text-xs text-muted-foreground border-t pt-2">
          Local authority:{" "}
          <span className="font-medium text-foreground">{localAuthority}</span>
        </p>
      )}
    </div>
  );
}

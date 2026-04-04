import { Receipt, ExternalLink } from "lucide-react";

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

function formatCurrency(pounds: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pounds);
}

// Band to colour mapping (A=lowest, H/I=highest in England)
const BAND_BG: Record<string, string> = {
  A: "bg-success-light text-success-dark",
  B: "bg-success-light text-success",
  C: "bg-success-light text-success",
  D: "bg-warning-light text-warning",
  E: "bg-warning-light text-warning",
  F: "bg-warning-light text-warning",
  G: "bg-error-light text-error",
  H: "bg-error-light text-error-dark",
  I: "bg-error-light text-error-dark",
};

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
      <div className="rounded-2xl bg-neutral-50 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-white flex items-center justify-center shadow-xs shrink-0">
            <Receipt className="size-4 text-neutral-500" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-neutral-900">Council Tax</p>
        </div>
        <p className="text-xs text-neutral-400">Council tax information unavailable.</p>
      </div>
    );
  }

  const monthly = estimatedAnnual != null ? Math.round(estimatedAnnual / 12) : null;
  const bandColorClass = BAND_BG[band.toUpperCase()] ?? "bg-neutral-100 text-neutral-700";

  return (
    <div className="rounded-2xl bg-neutral-50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-white flex items-center justify-center shadow-xs shrink-0">
            <Receipt className="size-4 text-neutral-500" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-neutral-900">Council Tax</p>
        </div>

        {/* Band badge */}
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${bandColorClass}`}
          aria-label={`Council tax Band ${band}`}
        >
          Band {band}
        </span>
      </div>

      {/* Cost breakdown */}
      {estimatedAnnual != null && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-3 text-center shadow-xs">
            <p className="text-xs text-neutral-500 mb-1">Per year</p>
            <p className="text-lg font-bold text-neutral-900 tabular-nums">
              {formatCurrency(estimatedAnnual)}
            </p>
          </div>
          {monthly != null && (
            <div className="rounded-xl bg-white p-3 text-center shadow-xs">
              <p className="text-xs text-neutral-500 mb-1">Per month</p>
              <p className="text-lg font-bold text-neutral-900 tabular-nums">
                {formatCurrency(monthly)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Local authority */}
      {localAuthority && (
        <p className="text-xs text-neutral-500 pt-1 border-t border-neutral-200">
          Local authority:{" "}
          <span className="font-medium text-neutral-700">{localAuthority}</span>
        </p>
      )}

      {/* Gov.uk link */}
      <a
        href="https://www.gov.uk/council-tax-bands"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline"
        aria-label="Learn about council tax bands on gov.uk (opens in new tab)"
      >
        Learn about council tax bands
        <ExternalLink className="size-3" aria-hidden="true" />
      </a>
    </div>
  );
}

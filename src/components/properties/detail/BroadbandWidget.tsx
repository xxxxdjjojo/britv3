import { Wifi } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = Readonly<{
  downloadMbps: number | null;
  uploadMbps: number | null;
  provider?: string | null;
  connectionType?: string | null;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_MBPS = 1000;

function speedRating(mbps: number): {
  label: string;
  badgeClass: string;
} {
  if (mbps >= 500)
    return {
      label: "Ultrafast",
      badgeClass:
        "bg-success-light text-success-dark dark:bg-success/20 dark:text-success",
    };
  if (mbps >= 100)
    return {
      label: "Superfast",
      badgeClass:
        "bg-success-light text-success dark:bg-success/20 dark:text-success",
    };
  if (mbps >= 10)
    return {
      label: "Standard",
      badgeClass:
        "bg-warning-light text-warning-dark dark:bg-warning/20 dark:text-warning",
    };
  return {
    label: "Basic",
    badgeClass:
      "bg-error-light text-error-dark dark:bg-error/20 dark:text-error",
  };
}

function clampPercent(value: number, max: number): number {
  return Math.min(100, Math.round((value / max) * 100));
}

function formatMbps(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
  return `${mbps} Mbps`;
}

// ---------------------------------------------------------------------------
// SpeedBar — inner visual component
// ---------------------------------------------------------------------------

function SpeedBar({
  label,
  mbps,
}: Readonly<{ label: string; mbps: number }>) {
  const pct = clampPercent(mbps, MAX_MBPS);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{formatMbps(mbps)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BroadbandWidget({
  downloadMbps,
  uploadMbps,
  provider,
  connectionType,
}: Props) {
  const hasData = downloadMbps != null || uploadMbps != null;

  if (!hasData) {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wifi className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium">Broadband</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Broadband data unavailable.
        </p>
      </div>
    );
  }

  const rating = downloadMbps != null ? speedRating(downloadMbps) : null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium">Broadband</p>
        </div>
        {rating && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${rating.badgeClass}`}
          >
            {rating.label}
          </span>
        )}
      </div>

      {/* Speed bars */}
      <div className="space-y-2">
        {downloadMbps != null && (
          <SpeedBar label="Download" mbps={downloadMbps} />
        )}
        {uploadMbps != null && (
          <SpeedBar label="Upload" mbps={uploadMbps} />
        )}
      </div>

      {/* Provider / connection type */}
      {(provider || connectionType) && (
        <div className="flex items-center gap-3 border-t pt-2 text-xs text-muted-foreground">
          {provider && (
            <span>
              Provider:{" "}
              <span className="font-medium text-foreground">{provider}</span>
            </span>
          )}
          {connectionType && (
            <span>
              Type:{" "}
              <span className="font-medium text-foreground">
                {connectionType}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

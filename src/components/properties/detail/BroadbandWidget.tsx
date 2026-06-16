import { Wifi } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Ofcom Connected Nations availability for a postcode: the % of premises that
 * can get each speed tier. Ofcom's open data carries no single download/upload
 * Mbit/s figure, so we present availability tiers — not fabricated speeds.
 */
type Props = Readonly<{
  superfastPct: number | null; // >=30 Mbit/s
  ultrafastPct: number | null; // >=300 Mbit/s
  gigabitPct: number | null; // gigabit-capable
  belowUsoPct?: number | null; // premises below the Universal Service Obligation
}>;

type Tier = {
  key: "gigabit" | "ultrafast" | "superfast" | "standard";
  label: string; // headline, e.g. "Gigabit (1000+ Mbps)"
  badgeClass: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVAILABLE_THRESHOLD = 50; // % of premises — "available" if the typical premise can get it

const TIERS: Record<Tier["key"], Tier> = {
  gigabit: {
    key: "gigabit",
    label: "Gigabit (1000+ Mbps)",
    badgeClass:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  ultrafast: {
    key: "ultrafast",
    label: "Ultrafast (300+ Mbps)",
    badgeClass:
      "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400",
  },
  superfast: {
    key: "superfast",
    label: "Superfast (30+ Mbps)",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  standard: {
    key: "standard",
    label: "Standard",
    badgeClass:
      "bg-muted text-muted-foreground",
  },
};

/** The fastest tier the typical premise in this postcode can get. */
function fastestTier(
  superfastPct: number | null,
  ultrafastPct: number | null,
  gigabitPct: number | null,
): Tier {
  if ((gigabitPct ?? 0) >= AVAILABLE_THRESHOLD) return TIERS.gigabit;
  if ((ultrafastPct ?? 0) >= AVAILABLE_THRESHOLD) return TIERS.ultrafast;
  if ((superfastPct ?? 0) >= AVAILABLE_THRESHOLD) return TIERS.superfast;
  return TIERS.standard;
}

function formatPct(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// AvailabilityRow — inner visual component
// ---------------------------------------------------------------------------

function AvailabilityRow({
  label,
  pct,
}: Readonly<{ label: string; pct: number }>) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{formatPct(pct)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-primary transition-all"
          style={{ width: `${Math.min(100, Math.round(pct))}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BroadbandWidget({
  superfastPct,
  ultrafastPct,
  gigabitPct,
  belowUsoPct,
}: Props) {
  const hasData =
    superfastPct != null || ultrafastPct != null || gigabitPct != null;

  // Graceful absence: render nothing when there is no data to show.
  if (!hasData) {
    return null;
  }

  const tier = fastestTier(superfastPct, ultrafastPct, gigabitPct);
  const limited = belowUsoPct != null && belowUsoPct > 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium">Broadband</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tier.badgeClass}`}
        >
          {tier.key === "standard" ? "Standard" : tier.key[0].toUpperCase() + tier.key.slice(1)}
        </span>
      </div>

      {/* Fastest available */}
      <div>
        <p className="text-xs text-muted-foreground">Fastest available</p>
        <p className="text-sm font-medium">{tier.label}</p>
      </div>

      {/* Per-tier availability (% of premises) */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Availability <span className="text-[11px]">(% of premises)</span>
        </p>
        {superfastPct != null && (
          <AvailabilityRow label="Superfast 30+" pct={superfastPct} />
        )}
        {ultrafastPct != null && (
          <AvailabilityRow label="Ultrafast 300+" pct={ultrafastPct} />
        )}
        {gigabitPct != null && (
          <AvailabilityRow label="Gigabit" pct={gigabitPct} />
        )}
      </div>

      {/* Material info: some premises here can't get decent broadband */}
      {limited && (
        <p className="border-t pt-2 text-xs text-amber-700 dark:text-amber-400">
          {formatPct(belowUsoPct!)} of premises here are below the Universal
          Service Obligation (decent broadband).
        </p>
      )}
    </div>
  );
}

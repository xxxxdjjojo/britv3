import { CheckCircle, Info, AlertTriangle, type LucideIcon } from "lucide-react";
import type { RiskBandId } from "@/lib/properties/rent-affordability-advanced";

/**
 * Risk visuals. Safe bands use the brand green system; caution bands use the
 * amber/orange/red caution ramp (the only place non-green is permitted on
 * public pages, and only for danger signalling).
 */

/** Gauge stroke hex per band (green → amber → red). */
export const RISK_GAUGE_HEX: Record<RiskBandId, string> = {
  excellent: "#1B4D3E",
  good: "#2D7A5F",
  fair: "#D97706",
  stretched: "#EA580C",
  risky: "#DC2626",
};

/** Badge classes per band, using always-available Tailwind palette + brand green. */
export const RISK_BADGE_CLASS: Record<RiskBandId, string> = {
  excellent: "bg-primary/10 text-primary border-primary/20",
  good: "bg-primary/10 text-primary border-primary/20",
  fair: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300",
  stretched:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300",
  risky: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300",
};

export const RISK_ICON: Record<RiskBandId, LucideIcon> = {
  excellent: CheckCircle,
  good: CheckCircle,
  fair: Info,
  stretched: AlertTriangle,
  risky: AlertTriangle,
};

/**
 * Stat card component for dashboard metrics.
 * Displays a value with label, optional trend indicator and change badge.
 */

import {
  ArrowDown,
  ArrowUp,
  Minus,
  type LucideIcon,
  Heart,
  Search,
  Calendar,
  FileText,
  Home,
  Eye,
  Tag,
  Building,
  Users,
  Briefcase,
  Star,
  PoundSterling,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { StatCardData } from "@/types/dashboard";

// Optional status accent rendered as a left border (e.g. compliance tiles)
type StatAccent = "success" | "warning" | "error";

const ACCENT_BORDER: Record<StatAccent, string> = {
  success: "border-l-4 border-l-success",
  warning: "border-l-4 border-l-warning",
  error: "border-l-4 border-l-error",
};

// ---------------------------------------------------------------------------
// Icon registry
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Heart,
  Search,
  Calendar,
  FileText,
  Home,
  Eye,
  Tag,
  Building,
  Users,
  Briefcase,
  Star,
  PoundSterling,
};

// ---------------------------------------------------------------------------
// Trend indicators
// ---------------------------------------------------------------------------

const TREND_CONFIG = {
  up: { icon: ArrowUp, color: "text-green-600 dark:text-green-400" },
  down: { icon: ArrowDown, color: "text-red-600 dark:text-red-400" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
} as const;

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

export function StatCard({
  label,
  value,
  change,
  trend,
  icon,
  accent,
}: Readonly<StatCardData & { accent?: StatAccent }>) {
  const IconComponent = icon ? ICON_MAP[icon] : null;
  const trendConfig = trend ? TREND_CONFIG[trend] : null;
  const TrendIcon = trendConfig?.icon;

  return (
    <Card
      className={cn(
        "rounded-xl border-border bg-card transition-shadow hover:shadow-sm",
        accent && ACCENT_BORDER[accent],
      )}
    >
      <CardContent className="flex items-start gap-4 p-4 md:p-5">
        {/* Icon */}
        {IconComponent && (
          <div className="bg-brand-primary/10 text-brand-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <IconComponent className="size-5" />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.1em]">
            {label}
          </p>
          <p className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            {value}
          </p>

          {/* Trend + change */}
          {trendConfig && (
            <div className={`flex items-center gap-1 text-xs ${trendConfig.color}`}>
              {TrendIcon && <TrendIcon className="size-3" />}
              {change !== undefined && change !== 0 && (
                <span>
                  {change > 0 ? "+" : ""}
                  {change}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton variant for loading state
// ---------------------------------------------------------------------------

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4 md:p-6">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

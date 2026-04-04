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
import type { StatCardData } from "@/types/dashboard";

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
  up: { icon: ArrowUp, color: "text-success dark:text-success" },
  down: { icon: ArrowDown, color: "text-error dark:text-error" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
} as const;

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

export function StatCard({ label, value, change, trend, icon }: Readonly<StatCardData>) {
  const IconComponent = icon ? ICON_MAP[icon] : null;
  const trendConfig = trend ? TREND_CONFIG[trend] : null;
  const TrendIcon = trendConfig?.icon;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-4 p-4 md:p-6">
        {/* Icon */}
        {IconComponent && (
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <IconComponent className="size-5" />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>

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

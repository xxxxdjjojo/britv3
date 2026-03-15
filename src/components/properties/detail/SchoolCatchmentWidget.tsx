"use client";

import { GraduationCap } from "lucide-react";
import type { OfstedSchool } from "@/services/properties/ofsted-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SchoolCatchmentWidgetProps = Readonly<{
  schools: OfstedSchool[] | null;
  isLoading?: boolean;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ratingBadgeClass(rating: OfstedSchool["rating"]): string {
  switch (rating) {
    case "Outstanding":
      return "bg-green-100 text-green-800";
    case "Good":
      return "bg-blue-100 text-blue-800";
    case "Requires improvement":
      return "bg-amber-100 text-amber-800";
    case "Inadequate":
      return "bg-red-100 text-red-800";
    case "Not yet inspected":
      return "bg-gray-100 text-gray-800";
  }
}

function typeBadgeClass(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes("secondary")) return "bg-purple-100 text-purple-800";
  if (lower.includes("primary")) return "bg-sky-100 text-sky-800";
  if (lower.includes("special")) return "bg-orange-100 text-orange-800";
  return "bg-gray-100 text-gray-800";
}

function formatDistance(miles: number): string {
  if (miles < 0.1) return "< 0.1 mi";
  return `${miles.toFixed(1)} mi`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SchoolSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 animate-pulse">
      <div className="h-5 w-40 bg-muted rounded mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="flex gap-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
            <div className="h-3 w-10 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Displays nearby Ofsted-rated schools for a property.
 * Client Component — supports isLoading skeleton state.
 */
export function SchoolCatchmentWidget({
  schools,
  isLoading,
}: SchoolCatchmentWidgetProps) {
  if (isLoading) return <SchoolSkeleton />;

  if (!schools || schools.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <GraduationCap className="size-4" /> Schools
        </h3>
        <p className="text-sm text-muted-foreground">
          School catchment data unavailable
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <GraduationCap className="size-4" /> Schools
      </h3>
      <ul className="space-y-3">
        {schools.map((school) => (
          <li key={school.ofsted_id} className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-tight">
                  {school.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistance(school.distance_miles)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {/* School type badge */}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeClass(school.type)}`}
                >
                  {school.type}
                </span>
                {/* Ofsted rating badge */}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ratingBadgeClass(school.rating)}`}
                >
                  {school.rating}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

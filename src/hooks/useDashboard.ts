"use client";

/**
 * Dashboard data hooks using React Query.
 * Fetches aggregated dashboard data and activity log from /api/dashboard.
 */

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { DashboardData, ActivityLogEntry } from "@/types/dashboard";
import type { DashboardResult, ActivityLogResult } from "@/services/dashboard/dashboard-service";

// ---------------------------------------------------------------------------
// Dashboard data hook
// ---------------------------------------------------------------------------

/**
 * Fetch aggregated dashboard data for the current user.
 * staleTime matches Redis cache TTL (5 minutes).
 */
export function useDashboard() {
  return useQuery<DashboardResult>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) {
        window.location.href = "/login";
        throw new Error("Session expired");
      }
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Session expired") return false;
      return failureCount < 3;
    },
    staleTime: 300_000, // 5 min, matches Redis TTL
  });
}

/**
 * Returns a function that invalidates the dashboard query cache
 * and refetches with ?refresh=true to bypass Redis cache.
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return async () => {
    // Invalidate React Query cache
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });

    // Refetch with refresh flag to also invalidate Redis
    const res = await fetch("/api/dashboard?refresh=true");
    if (res.status === 401) {
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    if (!res.ok) throw new Error("Failed to refresh dashboard data");
    const data = await res.json();

    // Update the query cache with fresh data
    queryClient.setQueryData(["dashboard"], data);

    return data as DashboardResult;
  };
}

// ---------------------------------------------------------------------------
// Activity log hook (infinite query with cursor pagination)
// ---------------------------------------------------------------------------

type ActivityPage = {
  entries: ActivityLogEntry[];
  nextCursor: string | null;
};

/**
 * Fetch paginated activity log with cursor-based pagination.
 * Uses useInfiniteQuery for "load more" pattern.
 */
export function useActivityLog() {
  return useInfiniteQuery<ActivityPage>({
    queryKey: ["activity-log"],
    queryFn: async ({ pageParam }) => {
      const url = new URL("/api/dashboard", window.location.origin);
      url.searchParams.set("activity", "true");
      if (pageParam) {
        url.searchParams.set("cursor", pageParam as string);
      }

      const res = await fetch(url.toString());
      if (res.status === 401) {
        window.location.href = "/login";
        throw new Error("Session expired");
      }
      if (!res.ok) throw new Error("Failed to fetch activity log");
      return res.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 300_000,
  });
}

// Re-export types for convenience
export type { DashboardData, DashboardResult, ActivityLogResult };

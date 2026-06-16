import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AnalyticsDegraded } from "@/components/admin/AnalyticsDegraded";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

type PageviewRow = { page: string; views: number };

type BehaviourData = {
  topPages: PageviewRow[];
  sessionCount: number;
} | null;

// ── PostHog fetching (cached 5 min) ───────────────────────────────────────────

const getBehaviourData = unstable_cache(
  async (): Promise<BehaviourData> => {
    try {
      const phKey = process.env.POSTHOG_PERSONAL_API_KEY;
      const phProject = process.env.NEXT_PUBLIC_POSTHOG_KEY
        ? (process.env.POSTHOG_PROJECT_ID ?? null)
        : null;

      if (!phKey || !phProject) return null;

      // Fetch pageview insight from PostHog
      const [pageviewRes, sessionRes] = await Promise.all([
        fetch(
          `https://app.posthog.com/api/projects/${phProject}/insights/trend/?events=[{"id":"$pageview","type":"events","order":0}]&breakdown=$current_url&date_from=-30d&limit=10`,
          { headers: { Authorization: `Bearer ${phKey}` } },
        ),
        fetch(
          `https://app.posthog.com/api/projects/${phProject}/insights/trend/?events=[{"id":"$session","type":"events","order":0}]&date_from=-30d`,
          { headers: { Authorization: `Bearer ${phKey}` } },
        ),
      ]);

      if (!pageviewRes.ok) return null;

      const pageviewData = (await pageviewRes.json()) as {
        results?: Array<{ breakdown_value: string; aggregated_value: number }>;
      };

      const topPages: PageviewRow[] = (pageviewData.results ?? [])
        .slice(0, 10)
        .map((r) => ({
          page: r.breakdown_value ?? "Unknown",
          views: r.aggregated_value ?? 0,
        }));

      let sessionCount = 0;
      if (sessionRes.ok) {
        const sessionData = (await sessionRes.json()) as {
          results?: Array<{ aggregated_value: number }>;
        };
        sessionCount =
          (sessionData.results ?? []).reduce(
            (sum, r) => sum + (r.aggregated_value ?? 0),
            0,
          );
      }

      return { topPages, sessionCount };
    } catch {
      return null;
    }
  },
  ["posthog-behaviour-data"],
  { revalidate: 300 },
);

// ── Content ───────────────────────────────────────────────────────────────────

async function BehaviourContent() {
  const data = await getBehaviourData();

  if (!data) {
    return (
      <div className="space-y-6">
        <AnalyticsDegraded
          service="PostHog"
          message="PostHog is not configured. Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID to enable behaviour analytics."
        />
        <FunnelsPlaceholder />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Session + Top Pages KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-neutral-500 mb-0.5">Sessions (30 days)</p>
          <p
            className="font-heading text-2xl font-semibold text-neutral-900"
          >
            {data.sessionCount.toLocaleString("en-GB")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-neutral-500 mb-0.5">Unique pages tracked</p>
          <p
            className="font-heading text-2xl font-semibold text-neutral-900"
          >
            {data.topPages.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-neutral-500 mb-0.5">Top page views</p>
          <p
            className="font-heading text-2xl font-semibold text-neutral-900"
          >
            {(data.topPages[0]?.views ?? 0).toLocaleString("en-GB")}
          </p>
          {data.topPages[0] && (
            <p className="text-xs text-neutral-400 mt-1 truncate">
              {data.topPages[0].page}
            </p>
          )}
        </div>
      </div>

      {/* Top 10 pages */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2
          className="font-heading text-base font-semibold text-neutral-900 mb-4"
        >
          Top 10 Pages by Pageview (30 days)
        </h2>
        {data.topPages.length === 0 ? (
          <p className="text-sm text-neutral-400">No pageview data.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left pb-2 font-medium text-neutral-500">#</th>
                <th className="text-left pb-2 font-medium text-neutral-500">Page URL</th>
                <th className="text-right pb-2 font-medium text-neutral-500">Views</th>
              </tr>
            </thead>
            <tbody>
              {data.topPages.map(({ page, views }, i) => (
                <tr key={page} className="border-b border-neutral-50 last:border-0">
                  <td className="py-2 text-neutral-400 pr-4">{i + 1}</td>
                  <td className="py-2 text-neutral-700 font-mono text-xs truncate max-w-xs">
                    {page}
                  </td>
                  <td className="py-2 text-right font-mono text-neutral-900">
                    {views.toLocaleString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FunnelsPlaceholder />
    </div>
  );
}

function FunnelsPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted p-6">
      <h2
        className="font-heading text-base font-semibold text-neutral-600 mb-2"
      >
        User Funnels
      </h2>
      <p className="text-sm text-neutral-400">
        Funnel analysis will appear here once PostHog funnel insights are configured.
      </p>
    </div>
  );
}

function BehaviourSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserBehaviourPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Analytics"
        title="User Behaviour"
        description="PostHog pageview analytics, sessions, and user funnels."
      />
      <Suspense fallback={<BehaviourSkeleton />}>
        <BehaviourContent />
      </Suspense>
    </div>
  );
}

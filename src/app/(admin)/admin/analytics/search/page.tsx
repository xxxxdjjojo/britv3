import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AnalyticsDegraded } from "@/components/admin/AnalyticsDegraded";
import { SearchVolumeChart } from "@/components/admin/SearchVolumeChart";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

type QueryRow = { query: string; count: number };
type VolumePoint = { date: string; count: number };

type SearchData = {
  topQueries: QueryRow[];
  zeroResultQueries: QueryRow[];
  volumeOverTime: VolumePoint[];
} | null;

// ── PostHog fetching (cached 5 min) ───────────────────────────────────────────

const getSearchData = unstable_cache(
  async (): Promise<SearchData> => {
    try {
      const phKey = process.env.POSTHOG_PERSONAL_API_KEY;
      const phProject = process.env.POSTHOG_PROJECT_ID ?? null;

      if (!phKey || !phProject) return null;

      const [topRes, zeroRes, volumeRes] = await Promise.all([
        // Top search queries (property_search event, breakdown by query property)
        fetch(
          `https://app.posthog.com/api/projects/${phProject}/insights/trend/?events=[{"id":"property_search","type":"events","order":0}]&breakdown=query&date_from=-30d&limit=20`,
          { headers: { Authorization: `Bearer ${phKey}` } },
        ),
        // Zero-result queries
        fetch(
          `https://app.posthog.com/api/projects/${phProject}/insights/trend/?events=[{"id":"search_no_results","type":"events","order":0}]&breakdown=query&date_from=-30d&limit=20`,
          { headers: { Authorization: `Bearer ${phKey}` } },
        ),
        // Search volume over time (daily)
        fetch(
          `https://app.posthog.com/api/projects/${phProject}/insights/trend/?events=[{"id":"property_search","type":"events","order":0}]&date_from=-30d&interval=day`,
          { headers: { Authorization: `Bearer ${phKey}` } },
        ),
      ]);

      if (!topRes.ok) return null;

      const topData = (await topRes.json()) as {
        results?: Array<{ breakdown_value: string; aggregated_value: number }>;
      };
      const topQueries: QueryRow[] = (topData.results ?? []).map((r) => ({
        query: r.breakdown_value ?? "(unknown)",
        count: r.aggregated_value ?? 0,
      }));

      let zeroResultQueries: QueryRow[] = [];
      if (zeroRes.ok) {
        const zeroData = (await zeroRes.json()) as {
          results?: Array<{ breakdown_value: string; aggregated_value: number }>;
        };
        zeroResultQueries = (zeroData.results ?? []).map((r) => ({
          query: r.breakdown_value ?? "(unknown)",
          count: r.aggregated_value ?? 0,
        }));
      }

      let volumeOverTime: VolumePoint[] = [];
      if (volumeRes.ok) {
        const volData = (await volumeRes.json()) as {
          results?: Array<{ days: string[]; data: number[] }>;
        };
        const firstResult = volData.results?.[0];
        if (firstResult?.days && firstResult.data) {
          volumeOverTime = firstResult.days.map((date, i) => ({
            date: date.slice(5), // MM-DD
            count: firstResult.data[i] ?? 0,
          }));
        }
      }

      return { topQueries, zeroResultQueries, volumeOverTime };
    } catch {
      return null;
    }
  },
  ["posthog-search-data"],
  { revalidate: 300 },
);

// ── Content ───────────────────────────────────────────────────────────────────

async function SearchContent() {
  const data = await getSearchData();

  if (!data) {
    return (
      <AnalyticsDegraded
        service="PostHog"
        message="PostHog is not configured. Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID to enable search analytics."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Volume Chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2
          className="font-heading text-base font-semibold text-neutral-900 mb-1"
        >
          Search Volume (Last 30 days)
        </h2>
        {data.volumeOverTime.length > 0 ? (
          <SearchVolumeChart data={data.volumeOverTime} />
        ) : (
          <p className="text-sm text-neutral-400">
            No search data yet — events will appear here as users search.
          </p>
        )}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top queries */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2
            className="font-heading text-base font-semibold text-neutral-900 mb-4"
          >
            Top 20 Search Queries
          </h2>
          {data.topQueries.length === 0 ? (
            <p className="text-sm text-neutral-400">No search query data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left pb-2 font-medium text-neutral-500">#</th>
                  <th className="text-left pb-2 font-medium text-neutral-500">Query</th>
                  <th className="text-right pb-2 font-medium text-neutral-500">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.topQueries.slice(0, 20).map(({ query, count }, i) => (
                  <tr key={query} className="border-b border-neutral-50 last:border-0">
                    <td className="py-1.5 text-neutral-400 pr-3">{i + 1}</td>
                    <td className="py-1.5 text-neutral-700 max-w-[200px] truncate">{query}</td>
                    <td className="py-1.5 text-right font-mono text-neutral-900">{count.toLocaleString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Zero-result queries */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2
            className="font-heading text-base font-semibold text-neutral-900 mb-4"
          >
            Zero-Result Queries
          </h2>
          {data.zeroResultQueries.length === 0 ? (
            <p className="text-sm text-neutral-400">No zero-result queries recorded.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left pb-2 font-medium text-neutral-500">#</th>
                  <th className="text-left pb-2 font-medium text-neutral-500">Query</th>
                  <th className="text-right pb-2 font-medium text-neutral-500">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.zeroResultQueries.map(({ query, count }, i) => (
                  <tr key={query} className="border-b border-neutral-50 last:border-0">
                    <td className="py-1.5 text-neutral-400 pr-3">{i + 1}</td>
                    <td className="py-1.5 text-neutral-700 max-w-[200px] truncate">{query}</td>
                    <td className="py-1.5 text-right font-mono text-neutral-900">{count.toLocaleString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SearchQueryInsightsPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Search Query Insights"
        description="Top search queries, zero-result searches, and search volume trends."
      />
      <Suspense fallback={<SearchSkeleton />}>
        <SearchContent />
      </Suspense>
    </div>
  );
}

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Activity } from "lucide-react";

type RedisStats = {
  available: false;
} | {
  available: true;
  requestsPerHour: number;
  topEndpoints: { endpoint: string; count: number }[];
  rateLimitedIps: string[];
};

async function getRedisStats(): Promise<RedisStats> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return { available: false };
  }

  try {
    // Fetch requests/hour key
    const [rphRes, endpointsRes, ipsRes] = await Promise.allSettled([
      fetch(`${redisUrl}/get/ratelimit:requests_per_hour`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      }),
      fetch(`${redisUrl}/hgetall/ratelimit:endpoint_counts`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      }),
      fetch(`${redisUrl}/smembers/ratelimit:blocked_ips`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      }),
    ]);

    let requestsPerHour = 0;
    if (rphRes.status === "fulfilled" && rphRes.value.ok) {
      const data = (await rphRes.value.json()) as { result?: string | number };
      requestsPerHour = parseInt(String(data.result ?? "0"), 10) || 0;
    }

    let topEndpoints: { endpoint: string; count: number }[] = [];
    if (endpointsRes.status === "fulfilled" && endpointsRes.value.ok) {
      const data = (await endpointsRes.value.json()) as { result?: string[] | null };
      const pairs = data.result ?? [];
      for (let i = 0; i < pairs.length - 1; i += 2) {
        topEndpoints.push({
          endpoint: pairs[i] ?? "",
          count: parseInt(pairs[i + 1] ?? "0", 10) || 0,
        });
      }
      topEndpoints.sort((a, b) => b.count - a.count);
      topEndpoints = topEndpoints.slice(0, 10);
    }

    let rateLimitedIps: string[] = [];
    if (ipsRes.status === "fulfilled" && ipsRes.value.ok) {
      const data = (await ipsRes.value.json()) as { result?: string[] | null };
      rateLimitedIps = data.result ?? [];
    }

    return { available: true, requestsPerHour, topEndpoints, rateLimitedIps };
  } catch {
    return { available: false };
  }
}

export default async function ApiUsagePage() {
  const stats = await getRedisStats();

  return (
    <div>
      <AdminPageHeader
        title="API Usage"
        description="Rate limit statistics and request volume from Upstash Redis."
      />

      {!stats.available ? (
        <AdminEmptyState
          icon={Activity}
          title="Redis not configured"
          description="Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables to enable API usage tracking."
        />
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-neutral-500 mb-1">Requests / hour</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {stats.requestsPerHour.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-neutral-500 mb-1">Top endpoints tracked</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {stats.topEndpoints.length}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-neutral-500 mb-1">Rate-limited IPs</p>
              <p className="text-2xl font-semibold text-red-600">
                {stats.rateLimitedIps.length}
              </p>
            </div>
          </div>

          {/* Top endpoints */}
          <div>
            <h2 className="text-sm font-semibold text-neutral-700 mb-3">
              Top Endpoints
            </h2>
            {stats.topEndpoints.length === 0 ? (
              <p className="text-sm text-neutral-400">No endpoint data recorded yet.</p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        Endpoint
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        Requests
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {stats.topEndpoints.map((ep) => (
                      <tr key={ep.endpoint} className="hover:bg-muted transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                          {ep.endpoint}
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-900 font-medium">
                          {ep.count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rate-limited IPs */}
          <div>
            <h2 className="text-sm font-semibold text-neutral-700 mb-3">
              Currently Rate-Limited IPs
            </h2>
            {stats.rateLimitedIps.length === 0 ? (
              <p className="text-sm text-neutral-400">No IPs currently rate-limited.</p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <ul className="divide-y divide-neutral-100">
                  {stats.rateLimitedIps.map((ip) => (
                    <li key={ip} className="px-4 py-2.5 font-mono text-sm text-neutral-700">
                      {ip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

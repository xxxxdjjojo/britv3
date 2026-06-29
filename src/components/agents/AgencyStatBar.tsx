/**
 * AgencyStatBar — Server Component
 *
 * Renders a 5-column stat strip inside AgencyHero showing key agency metrics:
 * active listings, sold/let count, avg days to sell, % of asking, and rating.
 */

import type { AgentPublicStats } from "@/types/providers";

type AgencyStatBarProps = Readonly<{
  stats: AgentPublicStats;
}>;

export default function AgencyStatBar({ stats }: AgencyStatBarProps) {
  const avgDays = stats.avg_days_to_sell != null ? String(stats.avg_days_to_sell) : "—";
  const avgPct = stats.avg_pct_asking != null ? `${stats.avg_pct_asking}%` : "—";
  const rating = stats.avg_rating != null ? `★ ${stats.avg_rating}` : "—";

  const statItems = [
    { value: String(stats.active_listings_count), label: "Active Listings" },
    { value: String(stats.sold_count), label: "Sold / Let" },
    { value: avgDays, label: "Avg. Days to Sell" },
    { value: avgPct, label: "% of Asking" },
    { value: rating, label: "Rating" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
      {statItems.map((item) => (
        <div key={item.label} className="text-center md:text-left">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1 uppercase tracking-tight">
            {item.label}
          </p>
          <p className="text-2xl font-bold text-brand-primary">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

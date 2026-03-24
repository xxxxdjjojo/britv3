
import { KPICard } from "@/components/dashboard/provider/KPICard";
import {
  TrendingUp,
  PoundSterling,
  Target,
  Clock,
  BarChart3,
} from "lucide-react";

const MONTHLY_DATA = [
  { month: "Oct", leads: 18, conversions: 6, revenue: 8200 },
  { month: "Nov", leads: 22, conversions: 8, revenue: 10400 },
  { month: "Dec", leads: 15, conversions: 5, revenue: 7100 },
  { month: "Jan", leads: 20, conversions: 7, revenue: 9800 },
  { month: "Feb", leads: 24, conversions: 9, revenue: 11200 },
  { month: "Mar", leads: 28, conversions: 10, revenue: 12450 },
];

const TOP_LENDERS = [
  { name: "Natwest", deals: 12, avgRate: 4.19 },
  { name: "HSBC", deals: 9, avgRate: 3.94 },
  { name: "Barclays", deals: 7, avgRate: 4.09 },
  { name: "Halifax", deals: 6, avgRate: 4.29 },
  { name: "Nationwide", deals: 5, avgRate: 3.89 },
];

const ENQUIRY_TYPES = [
  { type: "First-time buyer", count: 42, pct: 38 },
  { type: "Remortgage", count: 33, pct: 30 },
  { type: "Buy-to-let", count: 20, pct: 18 },
  { type: "Self-employed", count: 10, pct: 9 },
  { type: "Other", count: 5, pct: 5 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function AnalyticsPage() {
  const conversionRate = Math.round(
    (MONTHLY_DATA.reduce((s, m) => s + m.conversions, 0) /
      MONTHLY_DATA.reduce((s, m) => s + m.leads, 0)) *
      100
  );
  const totalRevenue = MONTHLY_DATA.reduce((s, m) => s + m.revenue, 0);
  const avgDealSize = Math.round(
    totalRevenue / MONTHLY_DATA.reduce((s, m) => s + m.conversions, 0)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track your business performance and identify growth opportunities.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={Target}
          trend={{ value: 5, direction: "up" }}
        />
        <KPICard
          title="Avg Deal Size"
          value={formatCurrency(avgDealSize)}
          icon={PoundSterling}
        />
        <KPICard
          title="Total Revenue (6mo)"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          trend={{ value: 18, direction: "up" }}
        />
        <KPICard
          title="Avg Time to Complete"
          value="34 days"
          icon={Clock}
          trend={{ value: 3, direction: "down" }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-900 flex items-center gap-2">
            <BarChart3 className="size-4 text-neutral-400" />
            Monthly Performance
          </h2>
          <div className="space-y-3">
            {MONTHLY_DATA.map((m) => {
              const maxRevenue = Math.max(...MONTHLY_DATA.map((d) => d.revenue));
              const barWidth = (m.revenue / maxRevenue) * 100;
              return (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-medium text-neutral-500">{m.month}</span>
                  <div className="flex-1">
                    <div className="h-6 rounded-md bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-md bg-[#1B4D3E] transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="text-neutral-500">{m.leads} leads</span>
                    <span className="font-semibold text-neutral-900">{formatCurrency(m.revenue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enquiry Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Enquiry Breakdown</h2>
          <div className="space-y-3">
            {ENQUIRY_TYPES.map((item) => (
              <div key={item.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-700">{item.type}</span>
                  <span className="text-xs font-semibold text-neutral-900">{item.count} ({item.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1B4D3E] transition-all"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Lenders */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Top Lenders Used</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">Lender</th>
                  <th className="px-3 py-2 text-right font-semibold text-neutral-600">Deals Placed</th>
                  <th className="px-3 py-2 text-right font-semibold text-neutral-600">Avg Rate</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">Share</th>
                </tr>
              </thead>
              <tbody>
                {TOP_LENDERS.map((lender) => {
                  const totalDeals = TOP_LENDERS.reduce((s, l) => s + l.deals, 0);
                  const share = Math.round((lender.deals / totalDeals) * 100);
                  return (
                    <tr key={lender.name} className="border-b border-neutral-100">
                      <td className="px-3 py-2.5 font-medium text-neutral-900">{lender.name}</td>
                      <td className="px-3 py-2.5 text-right text-neutral-700">{lender.deals}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-[#1B4D3E]">{lender.avgRate.toFixed(2)}%</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#1B4D3E]"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-500 w-8">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building,
  Users,
  Calendar,
  PoundSterling,
  TrendingUp,
  MessageSquare,
  UserPlus,
  Eye,
  FileText,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentDashboardKpis } from "@/types/agent";
import type { ActivityFeedItem, ActivityChartPoint, LeadSourcePoint } from "@/services/agent/agent-dashboard-service";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// -- Lead source palette (cycles if more than 8 distinct sources) -------------

const LEAD_SOURCE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
];

function formatSourceLabel(source: string): string {
  return source
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// -- Helpers ------------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getActivityIcon(type: string) {
  switch (type) {
    case "lead_created":
    case "lead_updated":
      return UserPlus;
    case "viewing_booked":
    case "viewing_completed":
      return Eye;
    case "offer_received":
    case "offer_updated":
      return FileText;
    case "listing_created":
    case "listing_updated":
      return Home;
    case "message_sent":
    case "message_received":
      return MessageSquare;
    default:
      return MessageSquare;
  }
}

// -- KPI card config ----------------------------------------------------------

type KpiCardConfig = Readonly<{
  label: string;
  key: keyof AgentDashboardKpis;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  format?: (v: number) => string;
}>;

const KPI_CARDS: KpiCardConfig[] = [
  {
    label: "Active Listings",
    key: "active_listings_count",
    icon: Building,
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "New Leads",
    key: "new_leads_count",
    icon: Users,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Viewings This Week",
    key: "viewings_this_week_count",
    icon: Calendar,
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "Pending Offers",
    key: "pending_offers_count",
    icon: PoundSterling,
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    label: "Performance Score",
    key: "performance_score",
    icon: TrendingUp,
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    format: (v: number) => `${v}%`,
  },
];

// -- Component ----------------------------------------------------------------

export function AgentDashboardHome(
  props: Readonly<{
    kpis: AgentDashboardKpis;
    activityFeed: ActivityFeedItem[];
    chartData: ActivityChartPoint[];
    leadSources: LeadSourcePoint[];
  }>,
) {
  const { kpis, activityFeed, chartData, leadSources } = props;
  const totalLeads = leadSources.reduce((sum, s) => sum + s.count, 0);
  const hasChartData = chartData.some(
    (p) => p.listings > 0 || p.leads > 0 || p.viewings > 0,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Agent Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of your agency performance and recent activity.
        </p>
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          const value = kpis[card.key];
          const display = card.format ? card.format(value) : String(value);

          return (
            <Card key={card.key}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    card.iconBg,
                  )}
                >
                  <Icon className={cn("size-5", card.iconColor)} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {card.label}
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {display}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Overview — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {hasChartData ? (
            <>
              <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
                  Listings
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full bg-blue-500" />
                  Leads
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full bg-amber-500" />
                  Viewings
                </span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorViewings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="listings"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorListings)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorLeads)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="viewings"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorViewings)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="flex h-[250px] flex-col items-center justify-center gap-2 text-center">
              <TrendingUp className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                No activity recorded yet
              </p>
              <p className="text-xs text-muted-foreground/70">
                Your listings, leads, and viewings will appear here once you start using the dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead source doughnut chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {leadSources.length === 0 ? (
            <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
              <Users className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                No lead data yet
              </p>
              <p className="text-xs text-muted-foreground/70">
                Lead source breakdown will appear once you have leads.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {/* Doughnut */}
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={leadSources}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {leadSources.map((entry, index) => (
                      <Cell
                        key={entry.source}
                        fill={LEAD_SOURCE_COLORS[index % LEAD_SOURCE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} (${Math.round((value / totalLeads) * 100)}%)`,
                      formatSourceLabel(name),
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-1 flex-col gap-2">
                {leadSources.map((entry, index) => {
                  const color = LEAD_SOURCE_COLORS[index % LEAD_SOURCE_COLORS.length];
                  const pct = Math.round((entry.count / totalLeads) * 100);
                  return (
                    <div key={entry.source} className="flex items-center gap-2.5">
                      <span
                        className="inline-block size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="flex-1 text-sm text-foreground">
                        {formatSourceLabel(entry.source)}
                      </span>
                      <span className="text-sm font-medium tabular-nums text-foreground">
                        {entry.count}
                      </span>
                      <span className="w-8 text-right text-xs text-muted-foreground tabular-nums">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent activity timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityFeed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity to display.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {activityFeed.map((item) => {
                const Icon = getActivityIcon(item.type);
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <p className="text-sm text-foreground">
                        {item.description ?? item.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

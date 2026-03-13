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
import type { ActivityFeedItem } from "@/services/agent/agent-dashboard-service";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// -- Placeholder chart data ---------------------------------------------------

const CHART_DATA = [
  { date: "Mon", listings: 4, leads: 6, viewings: 3 },
  { date: "Tue", listings: 3, leads: 8, viewings: 5 },
  { date: "Wed", listings: 5, leads: 4, viewings: 7 },
  { date: "Thu", listings: 6, leads: 9, viewings: 4 },
  { date: "Fri", listings: 4, leads: 7, viewings: 6 },
  { date: "Sat", listings: 7, leads: 5, viewings: 8 },
  { date: "Sun", listings: 3, leads: 3, viewings: 2 },
];

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
  }>,
) {
  const { kpis, activityFeed } = props;

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
          <CardTitle className="text-base">Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
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
            <AreaChart data={CHART_DATA}>
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
              />
              <YAxis
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
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

"use client";

import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Building,
  UserPlus,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Plus,
  CheckCircle,
  MessageSquare,
  Calendar,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentDashboardKpis } from "@/types/agent";

// ============================================================================
// Types
// ============================================================================

type ActivityFeedItem = {
  id: string;
  type: string;
  description: string | null;
  actor_id: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type Props = Readonly<{
  kpis: AgentDashboardKpis;
  activityFeed: ActivityFeedItem[];
  agentName: string;
}>;

// ============================================================================
// Helpers
// ============================================================================

/** Generate mock 30-day activity chart data seeded from KPIs */
function generateChartData(kpis: AgentDashboardKpis) {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - i));
    const label = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    // Simulate realistic activity counts that trend toward current KPIs
    const progress = (i + 1) / 30;
    return {
      date: label,
      listings: Math.round(
        (kpis.active_listings_count * 0.6 + Math.random() * 8) * progress,
      ),
      leads: Math.round(
        (kpis.new_leads_count * 1.2 + Math.random() * 5) * progress,
      ),
      viewings: Math.round(
        (kpis.viewings_this_week_count * 0.8 + Math.random() * 4) * progress,
      ),
    };
  });
}

/** Map activity type to an icon and colour class */
function activityIcon(type: string) {
  switch (type) {
    case "lead_created":
      return { Icon: UserPlus, colour: "text-blue-500" };
    case "stage_changed":
      return { Icon: TrendingUp, colour: "text-emerald-500" };
    case "viewing_booked":
      return { Icon: Calendar, colour: "text-amber-500" };
    case "offer_made":
      return { Icon: FileText, colour: "text-purple-500" };
    case "message_sent":
      return { Icon: MessageSquare, colour: "text-sky-500" };
    case "lead_closed":
      return { Icon: CheckCircle, colour: "text-green-600" };
    default:
      return { Icon: Star, colour: "text-muted-foreground" };
  }
}

/** Relative time label e.g. "2 hours ago" */
function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============================================================================
// KPI card
// ============================================================================

type KpiCardProps = {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: "up" | "down" | "flat";
};

function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            iconBg,
          )}
        >
          <Icon className={cn("size-5", iconColor)} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {trend && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                trend === "up" && "text-emerald-600 dark:text-emerald-400",
                trend === "down" && "text-red-500 dark:text-red-400",
                trend === "flat" && "text-muted-foreground",
              )}
            >
              {trend === "up" && <TrendingUp className="size-3" />}
              {trend === "down" && <TrendingDown className="size-3" />}
              {trend === "flat" && <Minus className="size-3" />}
              {trend === "up" ? "Trending up" : trend === "down" ? "Trending down" : "No change"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function AgentDashboardHome({ kpis, activityFeed, agentName }: Props) {
  const chartData = generateChartData(kpis);
  const performancePct = Math.round(kpis.performance_score * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Agent Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {agentName.split("@")[0]}. Here&apos;s what&apos;s happening.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full border bg-card p-2 text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-5" />
          </button>
          <Button render={<Link href="/dashboard/agent/listings/new" />}>
            <Plus className="mr-2 size-4" />
            New Listing
          </Button>
        </div>
      </div>

      {/* KPI cards — 5 stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Active Listings"
          value={kpis.active_listings_count}
          icon={Building}
          iconBg="bg-blue-100 dark:bg-blue-900/40"
          iconColor="text-blue-600 dark:text-blue-400"
          trend={kpis.active_listings_count > 0 ? "up" : "flat"}
        />
        <KpiCard
          label="New Leads"
          value={kpis.new_leads_count}
          icon={UserPlus}
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
          trend={kpis.new_leads_count > 0 ? "up" : "flat"}
        />
        <KpiCard
          label="Viewings This Week"
          value={kpis.viewings_this_week_count}
          icon={Eye}
          iconBg="bg-amber-100 dark:bg-amber-900/40"
          iconColor="text-amber-600 dark:text-amber-400"
          trend="flat"
        />
        <KpiCard
          label="Pending Offers"
          value={kpis.pending_offers_count}
          icon={FileText}
          iconBg="bg-purple-100 dark:bg-purple-900/40"
          iconColor="text-purple-600 dark:text-purple-400"
          trend={kpis.pending_offers_count > 0 ? "up" : "flat"}
        />
        <KpiCard
          label="Performance Score"
          value={`${performancePct}%`}
          icon={TrendingUp}
          iconBg="bg-rose-100 dark:bg-rose-900/40"
          iconColor="text-rose-600 dark:text-rose-400"
          trend={performancePct >= 50 ? "up" : performancePct > 0 ? "flat" : "down"}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column — chart */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">30-Day Activity</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full bg-blue-500" />
                  Listings
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
                  Leads
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full bg-amber-500" />
                  Viewings
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradListings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradViewings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    interval={6}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
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
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#gradListings)"
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gradLeads)"
                  />
                  <Area
                    type="monotone"
                    dataKey="viewings"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#gradViewings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right column — performance score */}
        <div className="lg:col-span-4">
          <Card className="h-full bg-brand-primary text-white">
            <CardHeader>
              <CardTitle className="text-base text-white">
                Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {/* Circular gauge */}
              <svg width="140" height="140" className="-rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-white/20"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={
                    2 * Math.PI * 54 -
                    (performancePct / 100) * 2 * Math.PI * 54
                  }
                  className="stroke-current text-white"
                />
              </svg>
              <div className="-mt-[108px] mb-8 flex flex-col items-center">
                <span className="text-3xl font-bold">{performancePct}</span>
                <span className="text-xs text-white/70">/100</span>
              </div>
              <p className="text-sm font-semibold">
                {performancePct >= 70
                  ? "Excellent Performance"
                  : performancePct >= 40
                    ? "Good Performance"
                    : "Getting Started"}
              </p>
              <p className="text-center text-xs text-white/70">
                Based on closed leads vs. total leads in your pipeline.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          {activityFeed.length > 0 && (
            <Badge variant="secondary">{activityFeed.length} events</Badge>
          )}
        </CardHeader>
        <CardContent>
          {activityFeed.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity yet. Create your first lead to get started.
            </p>
          ) : (
            <ol className="relative border-l border-border pl-6">
              {activityFeed.slice(0, 10).map((item) => {
                const { Icon, colour } = activityIcon(item.type);
                return (
                  <li key={item.id} className="mb-6 last:mb-0">
                    <span
                      className={cn(
                        "absolute -left-3 flex size-6 items-center justify-center rounded-full border bg-card",
                        colour,
                      )}
                    >
                      <Icon className="size-3" />
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      {item.description ?? item.type.replace(/_/g, " ")}
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {relativeTime(item.created_at)}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

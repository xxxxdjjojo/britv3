"use client";

import Link from "next/link";
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
  Sparkles,
  Home,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AgentDashboardKpis, ActivityFeedItem, DiaryViewingSlot } from "@/types/agent";

// ============================================================================
// Types
// ============================================================================

type Props = Readonly<{
  kpis: AgentDashboardKpis;
  activityFeed: ActivityFeedItem[];
  agentName: string;
  todaysDiary: DiaryViewingSlot[];
}>;

// ============================================================================
// Helpers
// ============================================================================

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
  trend?: "up" | "down" | "flat";
};

function KpiCard({ label, value, icon: Icon, trend }: KpiCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 transition-shadow hover:shadow-sm h-full">
      <div className="flex items-start gap-4">
        <span className="bg-brand-primary/10 text-brand-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-5" />
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.1em]">
            {label}
          </p>
          <p className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "mt-1 flex items-center gap-0.5 text-xs font-medium",
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
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function AiSuggestionsSection() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Sparkles className="size-5 text-amber-500" />
        <CardTitle className="text-base">AI Suggestions</CardTitle>
        <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          AI-powered insights will appear here based on your pipeline activity.
        </p>
      </CardContent>
    </Card>
  );
}

function TodaysDiarySection({ slots }: Readonly<{ slots: DiaryViewingSlot[] }>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Calendar className="size-5 text-blue-500" />
        <CardTitle className="text-base">Today&apos;s Diary</CardTitle>
        {slots.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {slots.length} viewing{slots.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {slots.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No viewings scheduled for today.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {slots.map((slot) => (
              <div key={slot.id} className="flex items-center gap-4 rounded-lg border p-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {new Date(slot.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    {" \u2014 "}
                    {new Date(slot.end_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Property: {slot.property_id.slice(0, 8)}&hellip;
                  </span>
                </div>
                <Badge variant={slot.is_booked ? "default" : "outline"} className="ml-auto">
                  {slot.is_booked ? "Booked" : "Available"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LettingsKpiSection() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Lettings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Home className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Set up lettings to see data here
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Track managed properties, compliance alerts, arrears, and maintenance queues.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function AgentDashboardHome({ kpis, activityFeed, agentName, todaysDiary }: Props) {
  const performancePct = Math.round(kpis.performance_score * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Welcome back
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark mt-1">
            Agent Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            {agentName.split("@")[0]}, here&apos;s what&apos;s happening.
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

      {/* AI Suggestions */}
      <AiSuggestionsSection />

      {/* Today's Diary */}
      <TodaysDiarySection slots={todaysDiary} />

      {/* Sales + Lettings KPI split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales KPIs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <KpiCard
                  label="Active Listings"
                  value={kpis.active_listings_count}
                  icon={Building}
                  trend={kpis.active_listings_count > 0 ? "up" : "flat"}
                />
                <KpiCard
                  label="New Leads"
                  value={kpis.new_leads_count}
                  icon={UserPlus}
                  trend={kpis.new_leads_count > 0 ? "up" : "flat"}
                />
                <KpiCard
                  label="Viewings This Week"
                  value={kpis.viewings_this_week_count}
                  icon={Eye}
                  trend="flat"
                />
                <KpiCard
                  label="Pending Offers"
                  value={kpis.pending_offers_count}
                  icon={FileText}
                  trend={kpis.pending_offers_count > 0 ? "up" : "flat"}
                />
                <KpiCard
                  label="Performance Score"
                  value={`${performancePct}%`}
                  icon={TrendingUp}
                  trend={performancePct >= 50 ? "up" : performancePct > 0 ? "flat" : "down"}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <LettingsKpiSection />
        </div>
      </div>

      {/* Activity overview placeholder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No activity data yet
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Activity trends will appear here once you start tracking leads and viewings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance score */}
      <Card className="bg-brand-primary text-white">
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

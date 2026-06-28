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
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import DashboardMessagesLink from "@/components/messaging/DashboardMessagesLink";
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
// KPI card — horizontal stat tile
// ============================================================================

type KpiCardProps = {
  label: string;
  value: number | string;
  icon: React.ElementType;
  trend?: "up" | "down" | "flat";
  badge?: string;
};

function KpiCard({ label, value, icon: Icon, trend, badge }: KpiCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 transition-shadow hover:shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="bg-brand-primary/10 text-brand-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </span>
        {badge && (
          <Badge variant="secondary" className="text-[10px] font-semibold">
            {badge}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.1em]">
          {label}
        </p>
      </div>
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
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <SectionHeader title="Today's Diary" />
        <Button asChild size="sm">
          <Link href="/dashboard/agent/viewings">
            <Plus className="mr-1.5 size-3.5" />
            New Viewing
          </Link>
        </Button>
      </div>
      {slots.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No viewings scheduled for today.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-xs font-semibold">
                  {new Date(slot.start_time).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Badge>
                <Badge variant={slot.is_booked ? "default" : "outline"}>
                  {slot.is_booked ? "Booked" : "Available"}
                </Badge>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {new Date(slot.start_time).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" — "}
                  {new Date(slot.end_time).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-xs text-muted-foreground">
                  Property: {slot.property_id.slice(0, 8)}&hellip;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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

// Pipeline stage funnel row — values mapped directly from available KPI fields.
// Stages without a KPI counterpart show "—" rather than inferred numbers.
type PipelineStage = {
  label: string;
  value: number | null;
};

function LeadPipelineSection({
  newLeads,
  pendingOffers,
  viewings,
}: {
  newLeads: number;
  pendingOffers: number;
  viewings: number;
}) {
  const stages: PipelineStage[] = [
    { label: "New", value: newLeads },
    { label: "Contacted", value: null },
    { label: "Booked", value: viewings },
    { label: "Offer", value: pendingOffers },
    { label: "Won", value: null },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Lead Pipeline"
        action={{ label: "View All Leads", href: "/dashboard/agent/leads" }}
      />
      <div className="grid grid-cols-5 gap-2">
        {stages.map(({ label, value }) => (
          <div
            key={label}
            className="bg-surface rounded-xl border border-border p-3 text-center flex flex-col gap-1"
          >
            <p className="font-heading text-xl font-bold tracking-tight">
              {value !== null ? value : "—"}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityOverviewPlaceholder() {
  return (
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
  );
}

// ============================================================================
// Performance Score panel (InsightPanel wrapper)
// ============================================================================

function PerformanceScorePanel({ performancePct }: { performancePct: number }) {
  const label =
    performancePct >= 70
      ? "Excellent Performance"
      : performancePct >= 40
        ? "Good Performance"
        : "Getting Started";

  return (
    <InsightPanel
      title="Performance Score"
      eyebrow="vs. Local Area Benchmark"
      icon={TrendingUp}
    >
      {/* Circular gauge */}
      <div className="flex flex-col items-center gap-3 my-2">
        <div className="relative">
          <svg width="120" height="120" className="-rotate-90">
            <circle
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-white/20"
            />
            <circle
              cx="60"
              cy="60"
              r="46"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={
                2 * Math.PI * 46 - (performancePct / 100) * 2 * Math.PI * 46
              }
              className="stroke-current text-brand-gold"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{performancePct}</span>
            <span className="text-[10px] text-white/70">OUT OF 100</span>
          </div>
        </div>
        <p className="text-sm font-semibold">{label}</p>
      </div>
      {/* Description */}
      <p className="text-center text-xs text-white/70 border-t border-white/20 pt-3 mt-1">
        Based on closed leads vs. total leads in your pipeline.
      </p>
    </InsightPanel>
  );
}

// ============================================================================
// Recent Activity feed (sidebar panel)
// ============================================================================

function RecentActivityPanel({ activityFeed }: { activityFeed: ActivityFeedItem[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
        {activityFeed.length > 0 && (
          <Badge variant="secondary">{activityFeed.length} events</Badge>
        )}
      </CardHeader>
      <CardContent>
        {activityFeed.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No activity yet. Create your first lead to get started.
          </p>
        ) : (
          <ol className="relative border-l border-border pl-5">
            {activityFeed.slice(0, 10).map((item) => {
              const { Icon, colour } = activityIcon(item.type);
              return (
                <li key={item.id} className="mb-4 last:mb-0">
                  <span
                    className={cn(
                      "absolute -left-2.5 flex size-5 items-center justify-center rounded-full border bg-card",
                      colour,
                    )}
                  >
                    <Icon className="size-3" />
                  </span>
                  <p className="text-sm font-medium text-foreground leading-snug">
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
          <DashboardMessagesLink variant="icon" />
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full border bg-card p-2 text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-5" />
          </button>
          <Button asChild>
            <Link href="/dashboard/agent/listings/new">
              <Plus className="mr-2 size-4" />
              New Listing
            </Link>
          </Button>
        </div>
      </div>

      {/* AI Suggestions */}
      <AiSuggestionsSection />

      {/* KPI tiles — 4-column row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          badge={kpis.new_leads_count > 0 ? "Requires action" : undefined}
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
          badge={kpis.pending_offers_count > 0 ? "High priority" : undefined}
        />
      </div>

      {/* Main 2-column layout: left = charts/pipeline, right = score + activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Activity Overview (chart placeholder) */}
          <ActivityOverviewPlaceholder />

          {/* Lead Pipeline funnel */}
          <LeadPipelineSection
            newLeads={kpis.new_leads_count}
            pendingOffers={kpis.pending_offers_count}
            viewings={kpis.viewings_this_week_count}
          />

          {/* Sales KPIs + Lettings split */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sales KPIs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <KpiCard
                    label="Performance Score"
                    value={`${performancePct}%`}
                    icon={TrendingUp}
                    trend={
                      performancePct >= 50
                        ? "up"
                        : performancePct > 0
                          ? "flat"
                          : "down"
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <LettingsKpiSection />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Performance Score — dark-green InsightPanel */}
          <PerformanceScorePanel performancePct={performancePct} />

          {/* Recent Activity */}
          <RecentActivityPanel activityFeed={activityFeed} />
        </div>
      </div>

      {/* Today's Diary */}
      <TodaysDiarySection slots={todaysDiary} />
    </div>
  );
}

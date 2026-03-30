"use client";

import Link from "next/link";
import {
  Building2,
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
  ArrowRight,
  ChevronRight,
} from "lucide-react";
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
      return { Icon: UserPlus, colour: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" };
    case "stage_changed":
      return { Icon: TrendingUp, colour: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" };
    case "viewing_booked":
      return { Icon: Calendar, colour: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" };
    case "offer_made":
      return { Icon: FileText, colour: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" };
    case "message_sent":
      return { Icon: MessageSquare, colour: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-900/20" };
    case "lead_closed":
      return { Icon: CheckCircle, colour: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" };
    default:
      return { Icon: Star, colour: "text-muted-foreground", bg: "bg-muted" };
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
  href?: string;
};

function KpiCard({ label, value, icon: Icon, iconBg, iconColor, trend, href }: KpiCardProps) {
  const inner = (
    <div className="group relative flex flex-col gap-4 rounded-xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:ring-border">
      <div className="flex items-start justify-between">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("size-5", iconColor)} strokeWidth={1.25} />
        </div>
        {href && (
          <ChevronRight className="size-4 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground">{value}</p>
        {trend && (
          <div
            className={cn(
              "mt-2 flex items-center gap-1 text-xs font-medium",
              trend === "up" && "text-emerald-600 dark:text-emerald-400",
              trend === "down" && "text-red-500 dark:text-red-400",
              trend === "flat" && "text-muted-foreground",
            )}
          >
            {trend === "up" && <TrendingUp className="size-3" strokeWidth={1.25} />}
            {trend === "down" && <TrendingDown className="size-3" strokeWidth={1.25} />}
            {trend === "flat" && <Minus className="size-3" strokeWidth={1.25} />}
            <span>{trend === "up" ? "Trending up" : trend === "down" ? "Trending down" : "No change"}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{inner}</Link>;
  }
  return inner;
}

// ============================================================================
// Sub-components
// ============================================================================

function AiSuggestionsSection() {
  return (
    <div className="rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
          <Sparkles className="size-4 text-white" strokeWidth={1.25} />
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold text-white">AI Suggestions</h3>
          <p className="text-xs text-white/70">Personalised insights for your pipeline</p>
        </div>
        <Badge className="ml-auto border-white/20 bg-white/15 text-white hover:bg-white/20">
          Coming Soon
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg bg-white/10 p-4">
            <Skeleton className="h-3 w-3/4 bg-white/20" />
            <Skeleton className="h-2.5 w-full bg-white/20" />
            <Skeleton className="h-2.5 w-2/3 bg-white/20" />
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-white/60">
        AI-powered insights will appear here based on your pipeline activity.
      </p>
    </div>
  );
}

function TodaysDiarySection({ slots }: Readonly<{ slots: DiaryViewingSlot[] }>) {
  return (
    <div className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-border/60">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Calendar className="size-4 text-blue-600" strokeWidth={1.25} />
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground">Today&apos;s Diary</h3>
          <p className="text-xs text-muted-foreground">Scheduled viewings for today</p>
        </div>
        {slots.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {slots.length} viewing{slots.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>
      {slots.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Calendar className="size-4 text-muted-foreground" strokeWidth={1.25} />
          </div>
          <p className="text-sm text-muted-foreground">No viewings scheduled for today.</p>
          <Link
            href="/dashboard/agent/viewings"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
          >
            Manage viewings <ArrowRight className="size-3" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-4 rounded-lg bg-muted/40 px-4 py-3"
            >
              <div className="flex h-10 w-14 shrink-0 flex-col items-center justify-center rounded-md bg-brand-primary/10 text-center">
                <span className="font-heading text-xs font-bold text-brand-primary leading-none">
                  {new Date(slot.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  Property {slot.property_id.slice(0, 8)}&hellip;
                </span>
                <span className="text-xs text-muted-foreground">
                  Until{" "}
                  {new Date(slot.end_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <Badge
                variant={slot.is_booked ? "default" : "outline"}
                className={cn(
                  "ml-auto shrink-0",
                  slot.is_booked && "bg-brand-primary text-white",
                )}
              >
                {slot.is_booked ? "Booked" : "Available"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LettingsKpiSection() {
  return (
    <div className="flex h-full flex-col rounded-xl bg-card p-5 shadow-sm ring-1 ring-border/60">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <Home className="size-4 text-muted-foreground" strokeWidth={1.25} />
        </div>
        <h3 className="font-heading text-sm font-semibold text-foreground">Lettings</h3>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Home className="size-6 text-muted-foreground" strokeWidth={1.25} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Set up lettings</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Track managed properties, compliance alerts, arrears, and maintenance queues.
          </p>
        </div>
        <Link
          href="/dashboard/agent/lettings/setup"
          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
        >
          Get started <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// Performance Gauge
// ============================================================================

function PerformanceGauge({ score }: Readonly<{ score: number }>) {
  const pct = Math.round(score * 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const label =
    pct >= 70
      ? "Excellent Performance"
      : pct >= 40
        ? "Good Performance"
        : "Getting Started";

  return (
    <div className="rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light p-6 text-white">
      <h3 className="font-heading text-sm font-semibold text-white mb-6">Performance Score</h3>
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <svg width="140" height="140" className="-rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="10"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-heading text-4xl font-bold text-white">{pct}</span>
            <span className="text-xs text-white/60">/100</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-xs text-white/60">
            Based on closed leads vs. total pipeline activity.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Activity Feed
// ============================================================================

function ActivityFeed({ items }: Readonly<{ items: ActivityFeedItem[] }>) {
  return (
    <div className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-border/60">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold text-foreground">Recent Activity</h3>
        {items.length > 0 && (
          <Badge variant="secondary">{items.length} events</Badge>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="size-5 text-muted-foreground" strokeWidth={1.25} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No activity yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Create your first lead to start tracking activity here.
            </p>
          </div>
        </div>
      ) : (
        <ol className="flex flex-col gap-1">
          {items.slice(0, 10).map((item) => {
            const { Icon, colour, bg } = activityIcon(item.type);
            return (
              <li key={item.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
                <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", bg)}>
                  <Icon className={cn("size-3.5", colour)} strokeWidth={1.25} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {item.description ?? item.type.replace(/_/g, " ")}
                  </p>
                  <time className="text-xs text-muted-foreground">{relativeTime(item.created_at)}</time>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function AgentDashboardHome({ kpis, activityFeed, agentName, todaysDiary }: Props) {
  const firstName = agentName.split("@")[0];
  const performancePct = Math.round(kpis.performance_score * 100);

  return (
    <div className="flex flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Agent Dashboard</p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground">
            Good morning, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your listings and pipeline.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border/60 transition-colors hover:text-foreground"
          >
            <Bell className="size-4" strokeWidth={1.25} />
          </button>
          <Button
            className="gap-2 bg-brand-primary text-white shadow-sm hover:bg-brand-primary-light"
            render={<Link href="/dashboard/agent/listings/create" />}
          >
            <Plus className="size-4" strokeWidth={1.5} />
            New Listing
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active Listings"
          value={kpis.active_listings_count}
          icon={Building2}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600"
          trend={kpis.active_listings_count > 0 ? "up" : "flat"}
          href="/dashboard/agent/listings"
        />
        <KpiCard
          label="New Leads"
          value={kpis.new_leads_count}
          icon={UserPlus}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600"
          trend={kpis.new_leads_count > 0 ? "up" : "flat"}
          href="/dashboard/agent/leads"
        />
        <KpiCard
          label="Viewings This Week"
          value={kpis.viewings_this_week_count}
          icon={Eye}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-600"
          trend="flat"
          href="/dashboard/agent/viewings"
        />
        <KpiCard
          label="Pending Offers"
          value={kpis.pending_offers_count}
          icon={FileText}
          iconBg="bg-purple-50 dark:bg-purple-900/20"
          iconColor="text-purple-600"
          trend={kpis.pending_offers_count > 0 ? "up" : "flat"}
          href="/dashboard/agent/offers"
        />
      </div>

      {/* AI suggestions */}
      <AiSuggestionsSection />

      {/* Today's diary */}
      <TodaysDiarySection slots={todaysDiary} />

      {/* Sales KPIs + Performance Gauge */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales KPI detail */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-border/60">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold text-foreground">Sales Overview</h3>
              <Link
                href="/dashboard/agent/analytics"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
              >
                Full analytics <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Active",
                  value: kpis.active_listings_count,
                  color: "text-blue-600",
                  bg: "bg-blue-50 dark:bg-blue-900/20",
                },
                {
                  label: "Leads",
                  value: kpis.new_leads_count,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 dark:bg-emerald-900/20",
                },
                {
                  label: "Viewings",
                  value: kpis.viewings_this_week_count,
                  color: "text-amber-600",
                  bg: "bg-amber-50 dark:bg-amber-900/20",
                },
                {
                  label: "Offers",
                  value: kpis.pending_offers_count,
                  color: "text-purple-600",
                  bg: "bg-purple-50 dark:bg-purple-900/20",
                },
                {
                  label: "Score",
                  value: `${performancePct}%`,
                  color: "text-brand-primary",
                  bg: "bg-brand-primary/10",
                },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={cn("flex flex-col gap-1 rounded-lg p-4", bg)}>
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <span className={cn("font-heading text-2xl font-bold", color)}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance gauge */}
        <PerformanceGauge score={kpis.performance_score} />
      </div>

      {/* Bottom row: activity feed + lettings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed items={activityFeed} />
        </div>
        <LettingsKpiSection />
      </div>
    </div>
  );
}

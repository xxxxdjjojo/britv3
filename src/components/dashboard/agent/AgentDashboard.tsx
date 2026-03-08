"use client";

/**
 * Agent dashboard content.
 * Shows stats ribbon, activity chart, lead pipeline, viewings,
 * performance score, and new listings — matching the Stitch agent-dashboard design.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  UserPlus,
  Eye,
  FileText,
  TrendingUp,
  Minus,
  Plus,
  MoreVertical,
  Calendar,
  Bell,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentDashboard as AgentData } from "@/types/dashboard";

/* -------------------------------------------------------------------------- */
/*  Mock display data                                                         */
/* -------------------------------------------------------------------------- */

const STATS = [
  {
    label: "Active Listings",
    value: "42",
    trend: "+4%",
    trendDir: "up" as const,
    icon: Building,
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "New Leads",
    value: "8",
    trend: "+12%",
    trendDir: "up" as const,
    icon: UserPlus,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Viewings This Week",
    value: "15",
    trend: "0%",
    trendDir: "flat" as const,
    icon: Eye,
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "Offers Pending",
    value: "3",
    trend: "+2",
    trendDir: "up" as const,
    icon: FileText,
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
] as const;

const PIPELINE = [
  { label: "Cold Leads", count: 24, pct: 65, color: "bg-blue-500" },
  { label: "Warm Prospects", count: 12, pct: 40, color: "bg-amber-500" },
  { label: "Hot Inquiries", count: 8, pct: 25, color: "bg-red-500" },
] as const;

const VIEWINGS = [
  {
    time: "10:30 AM",
    address: "24 Oakwood Crescent",
    client: "Sarah Jenkins",
  },
  {
    time: "2:15 PM",
    address: "Penthouse 4B, Sky Tower",
    client: "Robert Vance",
  },
] as const;

const NEW_LISTINGS = [
  {
    name: "Georgian Townhouse",
    price: "\u00a3875,000",
    badge: "NEW",
    badgeVariant: "default" as const,
  },
  {
    name: "Riverside Apartment",
    price: "\u00a3425,000",
    badge: "PREVIEW",
    badgeVariant: "secondary" as const,
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Decorative activity chart SVG                                             */
/* -------------------------------------------------------------------------- */

function ActivityChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Activity Overview</CardTitle>
        <button
          type="button"
          aria-label="More options"
          className="text-muted-foreground hover:text-foreground"
        >
          <MoreVertical className="size-4" />
        </button>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
            Listings
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-blue-500" />
            Enquiries
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-amber-500" />
            Viewings
          </span>
        </div>

        {/* Decorative SVG chart */}
        <svg
          viewBox="0 0 700 200"
          className="w-full"
          aria-hidden="true"
        >
          {/* Grid lines */}
          {[0, 50, 100, 150].map((y) => (
            <line
              key={y}
              x1="40"
              y1={y + 10}
              x2="680"
              y2={y + 10}
              className="stroke-border"
              strokeWidth="1"
            />
          ))}

          {/* Listings (green) */}
          <polyline
            fill="none"
            className="stroke-emerald-500"
            strokeWidth="2.5"
            strokeLinejoin="round"
            points="60,120 160,90 260,100 360,60 460,70 560,40 660,50"
          />

          {/* Enquiries (blue) */}
          <polyline
            fill="none"
            className="stroke-blue-500"
            strokeWidth="2.5"
            strokeLinejoin="round"
            points="60,140 160,130 260,110 360,120 460,100 560,90 660,80"
          />

          {/* Viewings (amber) */}
          <polyline
            fill="none"
            className="stroke-amber-500"
            strokeWidth="2.5"
            strokeLinejoin="round"
            points="60,160 160,150 260,140 360,145 460,130 560,120 660,115"
          />

          {/* Day labels */}
          {days.map((d, i) => (
            <text
              key={d}
              x={60 + i * 100}
              y="195"
              className="fill-muted-foreground text-[11px]"
              textAnchor="middle"
            >
              {d}
            </text>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Performance score gauge                                                   */
/* -------------------------------------------------------------------------- */

function PerformanceScore() {
  const score = 85;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="bg-brand-primary text-white">
      <CardHeader>
        <CardTitle className="text-base text-white">Performance Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
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
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-brand-accent stroke-current"
          />
        </svg>
        <div className="-mt-[106px] mb-8 flex flex-col items-center">
          <span className="text-3xl font-bold">{score}</span>
          <span className="text-xs text-white/70">/100</span>
        </div>

        <p className="text-sm font-semibold">Excellent Performance</p>
        <p className="text-center text-xs text-white/70">
          You&apos;re 12% above the regional average for agents in your area.
        </p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export function AgentDashboard({ data }: Readonly<{ data: AgentData }>) {
  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Agent Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, James. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full border bg-card p-2 text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-5" />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-red-500" />
          </button>
          <Button render={<Link href="/dashboard/agent/listings/new" />}>
              <Plus className="mr-2 size-4" />
              New Listing
          </Button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    stat.iconBg,
                  )}
                >
                  <Icon className={cn("size-5", stat.iconColor)} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {stat.label}
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium",
                      stat.trendDir === "up" && "text-emerald-600 dark:text-emerald-400",
                      stat.trendDir === "flat" && "text-muted-foreground",
                    )}
                  >
                    {stat.trendDir === "up" && <TrendingUp className="size-3" />}
                    {stat.trendDir === "flat" && <Minus className="size-3" />}
                    {stat.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Main content grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column (8 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Activity chart */}
          <ActivityChart />

          {/* Two-column sub-grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Lead Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {PIPELINE.map((stage) => (
                  <div key={stage.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{stage.label}</span>
                      <span className="text-muted-foreground">
                        {stage.count}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", stage.color)}
                        style={{ width: `${stage.pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {stage.pct}% of pipeline
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Today's Viewings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Today&apos;s Viewings
                </CardTitle>
                <Calendar className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {VIEWINGS.map((v) => (
                  <div
                    key={v.time}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                      {v.time.split(" ")[0]}
                      <br />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {v.address}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {v.client}
                      </span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" render={<Link href="/dashboard/agent/viewings" />}>
                    View Schedule
                    <ArrowRight className="ml-2 size-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right sidebar (4 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Performance Score */}
          <PerformanceScore />

          {/* New Listings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">New Listings</CardTitle>
              <Button variant="ghost" size="sm" render={<Link href="/dashboard/agent/listings" />}>
                  View All
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {NEW_LISTINGS.map((listing) => (
                <div
                  key={listing.name}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {/* Image placeholder */}
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Building className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {listing.name}
                    </span>
                    <span className="text-sm font-semibold text-brand-primary">
                      {listing.price}
                    </span>
                  </div>
                  <Badge variant={listing.badgeVariant}>
                    {listing.badge}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Live data section (from prop) ───────────────────────────────── */}
      {data.viewings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4" />
              Upcoming Viewings
              <Badge variant="secondary" className="ml-auto">
                {data.viewings.length} scheduled
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {data.viewings.map((viewing) => (
                <div
                  key={viewing.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">
                      {viewing.property_address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(viewing.scheduled_at).toLocaleDateString(
                        "en-GB",
                        {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                  <Badge
                    variant={
                      viewing.status === "confirmed" ? "default" : "secondary"
                    }
                  >
                    {viewing.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

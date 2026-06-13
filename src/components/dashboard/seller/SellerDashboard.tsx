"use client";

/**
 * Seller Dashboard — Stitch "Property Performance Overview".
 * Views Trend chart + Immediate Actions, Recent Enquiries + Upcoming Viewings,
 * and a deep-green Market Insight panel. Stat tiles are owned by the parent
 * page (StatCardGrid), so this component does not duplicate them.
 */

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import {
  Tag,
  CalendarCheck,
  FileText,
  Reply,
  Archive,
  Pencil,
  ChevronRight,
} from "lucide-react";
import type { SellerDashboard as SellerData } from "@/types/dashboard";

// -- Mock data ----------------------------------------------------------------

const VIEWS_TREND = [
  { day: "01 May", views: 180 },
  { day: "08 May", views: 240 },
  { day: "15 May", views: 210 },
  { day: "22 May", views: 320 },
  { day: "29 May", views: 380 },
  { day: "Today", views: 440 },
];

const IMMEDIATE_ACTIONS = [
  {
    id: "price",
    icon: Tag,
    title: "Update Price",
    description: "Adjust for current market",
  },
  {
    id: "viewings",
    icon: CalendarCheck,
    title: "Manage Viewings",
    description: "3 pending requests",
  },
  {
    id: "valuation",
    icon: FileText,
    title: "Request Valuation",
    description: "Professional assessment",
  },
];

const MOCK_ENQUIRIES = [
  {
    id: "1",
    initials: "JT",
    name: "Jameson Thorne",
    message:
      "Highly interested in the subterranean gallery space. Is there natural light provision during peak hours?",
    time: "2 hours ago",
  },
  {
    id: "2",
    initials: "ER",
    name: "Elena Rodriguez",
    message:
      "Would like to confirm if the smart-home ecosystem is compatible with Control4 systems.",
    time: "Yesterday",
  },
];

const MOCK_VIEWINGS = [
  {
    id: "1",
    month: "May",
    day: "24",
    name: "The Obsidian Penthouse",
    detail: "14:00 · Mr & Mrs Sterling",
  },
  {
    id: "2",
    month: "May",
    day: "26",
    name: "The Obsidian Penthouse",
    detail: "10:00 · Private Group",
  },
];

// -- Component ----------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SellerDashboard({ data }: Readonly<{ data: SellerData }>) {
  const lastIndex = VIEWS_TREND.length - 1;

  return (
    <div className="flex flex-col gap-8">
      {/* ── 1. Views Trend + Immediate Actions ───────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Views Trend (2/3) */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
                Views Trend
              </h2>
              <span className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-500">
                Last 30 Days
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={VIEWS_TREND}
                  margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
                  barCategoryGap="28%"
                >
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#737373", fontSize: 11 }}
                    dy={6}
                  />
                  <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                    {VIEWS_TREND.map((entry, index) => (
                      <Cell
                        key={entry.day}
                        fill={index === lastIndex ? "#003629" : "#BBCEC6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Immediate Actions (1/3) */}
        <Card className="lg:col-span-1">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
              Immediate Actions
            </h2>
            <div className="flex flex-col gap-3">
              {IMMEDIATE_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="group flex items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:border-brand-primary/30 hover:bg-neutral-50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-brand-primary transition group-hover:bg-brand-primary group-hover:text-white">
                    <action.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900">
                      {action.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-neutral-400 transition group-hover:text-brand-primary" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Recent Enquiries + Upcoming Viewings ──────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Enquiries */}
        <section className="space-y-4">
          <SectionHeader
            title="Recent Enquiries"
            action={{ label: "View All", href: "/dashboard/seller/enquiries" }}
          />
          <div className="flex flex-col gap-4">
            {MOCK_ENQUIRIES.map((enquiry) => (
              <Card key={enquiry.id}>
                <CardContent className="flex gap-4 p-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-700">
                    {enquiry.initials}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900">
                        {enquiry.name}
                      </p>
                      <span className="shrink-0 text-xs text-neutral-500">
                        {enquiry.time}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-neutral-500">
                      &ldquo;{enquiry.message}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-brand-primary">
                        <Reply className="mr-1 size-3.5" />
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-neutral-500">
                        <Archive className="mr-1 size-3.5" />
                        Archive
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Upcoming Viewings */}
        <section className="space-y-4">
          <SectionHeader
            title="Upcoming Viewings"
            action={{ label: "Schedule", href: "/dashboard/seller/viewings" }}
          />
          <div className="flex flex-col gap-4">
            {MOCK_VIEWINGS.map((viewing) => (
              <Card key={viewing.id}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border-l-2 border-brand-primary bg-neutral-50 py-2">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                      {viewing.month}
                    </span>
                    <span className="font-heading text-xl font-bold leading-tight text-neutral-900">
                      {viewing.day}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900">
                      {viewing.name}
                    </p>
                    <p className="text-xs text-neutral-500">{viewing.detail}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label="Edit viewing">
                    <Pencil className="size-4 text-neutral-500" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Market Insight panel */}
            <InsightPanel
              eyebrow="Market Insight"
              title="Demand is outpacing supply"
              action={{ label: "Learn more", href: "/dashboard/seller/insights" }}
            >
              Demand for boutique-inspired architecture in your area has risen
              by 18.5% this month.
            </InsightPanel>
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

/**
 * Seller Dashboard — Stitch-based design.
 * Shows listing performance, enquiries, viewings, and active listing card.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ListChecks,
  Eye,
  MessageSquare,
  CalendarCheck,
  TrendingUp,
  MoreVertical,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SellerDashboard as SellerData } from "@/types/dashboard";

// -- Mock data ----------------------------------------------------------------

const MOCK_ENQUIRIES = [
  {
    id: "1",
    initials: "JD",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    property: "Oakwood Manor",
    status: "New" as const,
  },
  {
    id: "2",
    initials: "MR",
    name: "Mark Ryan",
    email: "mark.r@gmail.com",
    property: "Oakwood Manor",
    status: "Replied" as const,
  },
  {
    id: "3",
    initials: "SL",
    name: "Sarah Lee",
    email: "sarah.l@web.com",
    property: "Oakwood Manor",
    status: "New" as const,
  },
];

const MOCK_VIEWINGS = [
  {
    id: "1",
    month: "Oct",
    day: "24",
    time: "14:00",
    name: "Robert Thompson",
    location: "Oakwood Manor, Site A",
  },
  {
    id: "2",
    month: "Oct",
    day: "25",
    time: "10:30",
    name: "Elena Gilbert",
    location: "Oakwood Manor, Main Hall",
  },
  {
    id: "3",
    month: "Oct",
    day: "27",
    time: "16:15",
    name: "Chris Evans",
    location: "Oakwood Manor, Gardens",
  },
];

const STAT_CARDS = [
  {
    label: "Active Listings",
    value: "1",
    trend: "Stable",
    trendType: "neutral" as const,
    icon: ListChecks,
  },
  {
    label: "Total Views",
    value: "2,847",
    trend: "+12.5%",
    trendType: "up" as const,
    icon: Eye,
  },
  {
    label: "Enquiries",
    value: "24",
    trend: "+4 new",
    trendType: "up" as const,
    icon: MessageSquare,
  },
  {
    label: "Upcoming Viewings",
    value: "3",
    trend: "Scheduled",
    trendType: "neutral" as const,
    icon: CalendarCheck,
  },
];

// -- Chart day labels ---------------------------------------------------------

// -- SVG chart path (decorative mock) ----------------------------------------

const CHART_PATH =
  "M0,120 C20,110 40,100 60,95 C80,90 100,85 120,75 C140,65 160,70 180,60 C200,50 220,55 240,45 C260,35 280,40 300,30 C320,25 340,28 360,20 C380,15 400,18 420,12 C440,8 460,10 480,5 C500,3 520,6 540,4 C560,2 580,5 600,3";

const CHART_AREA_PATH = CHART_PATH + " L600,140 L0,140 Z";

// -- Component ----------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SellerDashboard({ data }: Readonly<{ data: SellerData }>) {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Seller Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor performance and manage potential buyers for your properties.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            className="rounded-md bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            Last Quarter
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-start justify-between pt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "mt-0.5 w-fit text-[10px]",
                      stat.trendType === "up" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
                      stat.trendType === "neutral" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {stat.trendType === "up" && (
                      <TrendingUp className="mr-0.5 size-3" />
                    )}
                    {stat.trend}
                  </Badge>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Listing Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="size-4 text-muted-foreground" />
            Listing Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Daily views over the last 30 days
          </p>
          <div className="relative h-40 w-full overflow-hidden rounded-lg">
            <svg
              viewBox="0 0 600 140"
              className="h-full w-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="chartGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    className="text-brand-primary"
                    stopColor="currentColor"
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    className="text-brand-primary"
                    stopColor="currentColor"
                    stopOpacity="0.02"
                  />
                </linearGradient>
              </defs>
              <path
                d={CHART_AREA_PATH}
                fill="url(#chartGradient)"
              />
              <path
                d={CHART_PATH}
                fill="none"
                className="text-brand-primary"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>Day 1</span>
            <span>Day 8</span>
            <span>Day 15</span>
            <span>Day 22</span>
            <span>Day 30</span>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid: Enquiries + Viewings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Enquiries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              Recent Enquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ENQUIRIES.map((enquiry) => (
                  <TableRow key={enquiry.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                          {enquiry.initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {enquiry.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {enquiry.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {enquiry.property}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={enquiry.status === "New" ? "default" : "secondary"}
                      >
                        {enquiry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Upcoming Viewings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              Upcoming Viewings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {MOCK_VIEWINGS.map((viewing) => (
                <div
                  key={viewing.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Date block */}
                    <div className="flex size-12 flex-col items-center justify-center rounded-lg bg-muted">
                      <span className="text-[10px] font-medium uppercase text-muted-foreground">
                        {viewing.month}
                      </span>
                      <span className="text-lg font-bold leading-tight text-foreground">
                        {viewing.day}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {viewing.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {viewing.location}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {viewing.time}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Listing Card */}
      <Card className="bg-foreground text-background">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Property image placeholder */}
            <div className="size-20 shrink-0 rounded-lg bg-muted/20" />
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="w-fit bg-background/10 text-background text-[10px]">
                Active Listing
              </Badge>
              <h3 className="text-lg font-bold">Oakwood Manor</h3>
              <p className="text-sm opacity-70">
                12 days on market
              </p>
              <p className="text-xl font-bold">
                £4,250,000
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-background/20 bg-transparent text-background hover:bg-background/10"
            render={<Link href="/dashboard/seller/listings" />}
          >
            Manage Listing
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

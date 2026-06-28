
/**
 * Service Provider / Tradesperson dashboard content.
 * Shows verification banner, stats ribbon, earnings chart, lead opportunities,
 * quick actions, today's schedule, and premium insights — matching the Stitch design.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Inbox,
  Wrench,
  CheckCircle,
  Star,
  TrendingUp,
  MapPin,
  ArrowRight,
  CalendarCheck,
  FileText,
  Award,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardMessagesLink from "@/components/messaging/DashboardMessagesLink";
import type { ProviderDashboard as ProviderData } from "@/types/dashboard";

// -- Mock data ----------------------------------------------------------------

const MOCK_EARNINGS = [
  { day: "Mon", amount: 450, pct: 36 },
  { day: "Tue", amount: 780, pct: 63 },
  { day: "Wed", amount: 1240, pct: 100 },
  { day: "Thu", amount: 920, pct: 74 },
  { day: "Fri", amount: 680, pct: 55 },
  { day: "Sat", amount: 540, pct: 44 },
  { day: "Sun", amount: 0, pct: 0 },
] as const;

const MOCK_LEADS = [
  {
    id: "1",
    title: "Kitchen Plumbing Repair",
    distance: "2.4mi",
    client: "Sarah Jenkins",
    posted: "2h ago",
  },
  {
    id: "2",
    title: "Boiler Annual Service",
    distance: "0.8mi",
    client: "Mark Thompson",
    posted: "45min ago",
  },
] as const;

const MOCK_SCHEDULE = [
  {
    id: "1",
    time: "09:00",
    title: "Pipe Inspection",
    location: "Birmingham",
    status: "In Progress" as const,
  },
  {
    id: "2",
    time: "14:00",
    title: "Radiator Install",
    location: "Solihull",
    status: "Confirmed" as const,
  },
  {
    id: "3",
    time: "16:30",
    title: "Quote Consultation",
    location: "Digbeth",
    status: "Scheduled" as const,
  },
] as const;

const SCHEDULE_STATUS_CLASSES: Record<string, string> = {
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Scheduled: "bg-muted text-muted-foreground",
};

// -- Component ----------------------------------------------------------------

export function ProviderDashboard({ data }: Readonly<{ data: ProviderData }>) {
  return (
    <div className="flex flex-col gap-6">
      {/* ── Verification Banner ──────────────────────────────────────────── */}
      <Card className="bg-foreground text-background overflow-hidden">
        <CardContent className="flex flex-col gap-4 py-6">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-brand-secondary" />
            <h2 className="text-lg font-semibold">Complete Your Profile</h2>
          </div>
          <p className="text-background/70 text-sm">
            Your profile is 65% complete. Finish verification to unlock all features
            and start receiving job requests.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-background/60">Profile completion</span>
              <span className="font-medium">65%</span>
            </div>
            <div className="bg-background/20 h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-brand-secondary h-full rounded-full transition-all"
                style={{ width: "65%" }}
              />
            </div>
          </div>
          <Button
            size="sm"
            className="bg-brand-secondary text-foreground hover:bg-brand-secondary/90 w-fit"
            render={<Link href="/dashboard/provider/verification" />}
          >
              Continue Verification
              <ArrowRight className="ml-1 size-4" />
          </Button>
        </CardContent>
      </Card>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* New Leads */}
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <div className="flex items-center justify-between">
              <Inbox className="text-muted-foreground size-5" />
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="mr-1 size-3" />
                +4
              </Badge>
            </div>
            <span className="text-2xl font-bold">12</span>
            <span className="text-muted-foreground text-xs">New Leads</span>
            <span className="text-muted-foreground text-[11px]">+4 since yesterday</span>
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <Wrench className="text-muted-foreground size-5" />
            <span className="text-2xl font-bold">8</span>
            <span className="text-muted-foreground text-xs">Active Jobs</span>
            <span className="text-muted-foreground text-[11px]">3 due this week</span>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <CheckCircle className="text-muted-foreground size-5" />
            <span className="text-2xl font-bold">142</span>
            <span className="text-muted-foreground text-xs">Completed</span>
            <span className="text-muted-foreground text-[11px]">Lifetime total</span>
          </CardContent>
        </Card>

        {/* Rating */}
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="size-3.5 fill-brand-secondary text-brand-secondary"
                />
              ))}
            </div>
            <span className="text-2xl font-bold">4.9</span>
            <span className="text-muted-foreground text-xs">Rating</span>
            <span className="text-muted-foreground text-[11px]">86 reviews</span>
          </CardContent>
        </Card>
      </div>

      {/* ── Main 3-column Grid ───────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Earnings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4" />
                Earnings Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                {MOCK_EARNINGS.map((bar) => (
                  <div key={bar.day} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-muted-foreground text-[10px]">
                      {bar.amount > 0 ? `£${bar.amount}` : "—"}
                    </span>
                    <div className="relative h-32 w-full">
                      <div className="bg-primary/10 absolute inset-x-0 bottom-0 h-full rounded-t" />
                      {bar.pct > 0 && (
                        <div
                          className="bg-primary/20 absolute inset-x-0 bottom-0 rounded-t"
                          style={{ height: `${bar.pct}%` }}
                        >
                          <div className="bg-primary absolute inset-x-0 top-0 h-0.5 rounded-full" />
                        </div>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs font-medium">
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* New Lead Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Inbox className="size-4" />
                New Lead Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {MOCK_LEADS.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">{lead.title}</span>
                    <div className="text-muted-foreground flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {lead.distance}
                      </span>
                      <span>{lead.client}</span>
                      <span>{lead.posted}</span>
                    </div>
                  </div>
                  <Button size="sm" render={<Link href="/dashboard/provider/quotes/builder" />}>
                      Send Quote
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column (1/3) */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button className="w-full" render={<Link href="/dashboard/provider/availability" />}>
                  <CalendarCheck className="mr-1.5 size-4" />
                  Update Availability
              </Button>
              <Button variant="outline" className="w-full" render={<Link href="/dashboard/provider/quotes/builder" />}>
                  <FileText className="mr-1.5 size-4" />
                  New Quote
              </Button>
              <DashboardMessagesLink variant="button" className="col-span-2 w-full" />
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4" />
                Today&apos;s Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {MOCK_SCHEDULE.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-muted-foreground mt-0.5 text-xs font-medium tabular-nums">
                    {item.time}
                  </span>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <MapPin className="size-3" />
                      {item.location}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn("text-[11px]", SCHEDULE_STATUS_CLASSES[item.status])}
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Premium Insight */}
          <Card className="border-brand-secondary/30 bg-brand-secondary-light">
            <CardContent className="flex flex-col gap-2 py-4">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-brand-secondary" />
                <span className="text-sm font-semibold">Premium Insight</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Tradespeople in your area are charging 15% more for boiler services
                this month.
              </p>
              <Link
                href="/dashboard/provider/analytics"
                className="text-brand-secondary inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                View Market Insights
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

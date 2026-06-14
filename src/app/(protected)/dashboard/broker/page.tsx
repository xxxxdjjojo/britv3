
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatCardGrid } from "@/components/dashboard/DashboardShell";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import {
  Inbox,
  PackageSearch,
  ShieldCheck,
  ArrowRight,
  Plus,
  Mail,
  Calendar,
  TrendingUp,
} from "lucide-react";

const RECENT_ACTIVITY = [
  { id: 1, text: "New lead: Sarah Thompson enquired about remortgage", time: "12 min ago" },
  { id: 2, text: "Application submitted for James & Claire Reed", time: "2 hours ago" },
  { id: 3, text: "Offer accepted: Natwest 2-year fixed for M. Patel", time: "5 hours ago" },
  { id: 4, text: "FCA verification approved", time: "1 day ago" },
  { id: 5, text: "New review: 5 stars from David Collins", time: "2 days ago" },
];

const PIPELINE_STAGES = [
  { stage: "New Lead", count: 4, color: "bg-blue-500", width: "w-[25%]" },
  { stage: "Initial Consultation", count: 3, color: "bg-amber-500", width: "w-[19%]" },
  { stage: "Application Submitted", count: 2, color: "bg-purple-500", width: "w-[13%]" },
  { stage: "Underwriting", count: 1, color: "bg-orange-500", width: "w-[6%]" },
  { stage: "Approved", count: 1, color: "bg-emerald-500", width: "w-[6%]" },
  { stage: "Completed", count: 5, color: "bg-neutral-400", width: "w-[31%]" },
] as const;

export default function BrokerDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl">
      {/* Page header with CTA */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Welcome back
          </p>
          <h1 className="font-heading mt-1 text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            Mortgage Broker Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Here&apos;s an overview of your mortgage business today.
          </p>
        </div>
        <Button
          asChild
          className="shrink-0 gap-2 bg-brand-primary text-white hover:bg-brand-primary-dark"
        >
          <Link href="/dashboard/broker/leads">
            <Plus className="size-4" />
            Create New Application
          </Link>
        </Button>
      </div>

      {/* 4 KPI stat cards */}
      <StatCardGrid>
        <StatCard
          label="Active Leads"
          value={12}
          icon="Users"
          change={3}
          trend="up"
        />
        <StatCard
          label="Clients in Pipeline"
          value={8}
          icon="Briefcase"
          change={2}
          trend="up"
        />
        <StatCard
          label="Avg Completion Time"
          value="34 days"
          icon="Calendar"
          change={0}
          trend="neutral"
        />
        <StatCard
          label="Revenue This Month"
          value="£12,450"
          icon="PoundSterling"
          change={15}
          trend="up"
        />
      </StatCardGrid>

      {/* Pipeline Distribution */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <SectionHeader
              title="Pipeline Distribution"
              action={{ label: "View Pipeline", href: "/dashboard/broker/pipeline" }}
            />
            <p className="mt-0.5 text-xs text-neutral-400">
              Current overview of active client journeys
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-brand-primary inline-block" />
              High priority
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-neutral-300 inline-block" />
              No priority
            </span>
          </div>
        </div>

        {/* Horizontal stacked bar */}
        <div className="flex h-8 w-full overflow-hidden rounded-lg">
          {PIPELINE_STAGES.map((s) => (
            <div
              key={s.stage}
              className={`${s.color} ${s.width} flex items-center justify-center`}
              title={`${s.stage}: ${s.count}`}
            />
          ))}
        </div>

        {/* Stage labels */}
        <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 md:grid-cols-6">
          {PIPELINE_STAGES.map((s) => (
            <div key={s.stage} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className={`size-2 shrink-0 rounded-full ${s.color}`} />
                <span className="truncate text-[10px] font-semibold uppercase tracking-[0.06em] text-neutral-500">
                  {s.stage}
                </span>
              </div>
              <p className="text-xl font-bold tracking-tight text-neutral-900">{s.count}</p>
              <p className="text-[10px] text-neutral-400">Total leads</p>
            </div>
          ))}
        </div>
      </section>

      {/* Two-column: New Leads + Upcoming Meetings */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* New Leads Requiring Response */}
        <section className="rounded-xl border border-border bg-card p-5">
          <SectionHeader
            title="New Leads Requiring Response"
            action={{ label: "View All Leads", href: "/dashboard/broker/leads" }}
          />
          <div className="mt-4 flex flex-col divide-y divide-border">
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                {/* Avatar placeholder */}
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">
                  {item.id}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-800">{item.text}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3" />
                      Received: {item.time}
                    </span>
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="shrink-0 bg-brand-primary text-white hover:bg-brand-primary-dark"
                >
                  <Link href="/dashboard/broker/leads">Qualify</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Meetings */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
              Upcoming Meetings
            </h2>
            <Calendar className="size-4 text-neutral-400" />
          </div>
          <div className="flex flex-col gap-3">
            {[
              { time: "10:30", period: "AM", label: "David Chen", sub: "Mortgage Strategy Consultation", tag: "VIRTUAL" },
              { time: "02:00", period: "PM", label: "The Thompson Family", sub: "Offer Stage Legal Review", tag: "VIRTUAL" },
              { time: "04:10", period: "PM", label: "Lydia West", sub: "First Call Remortgage", tag: "IN PERSON" },
            ].map((meeting) => (
              <div key={meeting.label} className="flex items-start gap-3 rounded-lg bg-surface p-3">
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-brand-primary-dark">{meeting.time}</p>
                  <p className="text-[10px] text-neutral-400">{meeting.period}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-800">{meeting.label}</p>
                  <p className="text-xs text-neutral-400">{meeting.sub}</p>
                  <span className="mt-1 inline-block rounded text-[9px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                    {meeting.tag}
                  </span>
                </div>
              </div>
            ))}
            <Button asChild variant="outline" size="sm" className="mt-1 w-full border-border text-neutral-700 hover:bg-muted">
              <Link href="/dashboard/broker/pipeline">
                Full Calendar Access
                <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="rounded-xl border border-border bg-card p-5">
        <SectionHeader title="Quick Actions" />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild className="bg-brand-primary text-white hover:bg-brand-primary-dark">
            <Link href="/dashboard/broker/leads">
              <Inbox className="mr-2 size-4" />
              View Leads
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border text-neutral-700 hover:bg-muted">
            <Link href="/dashboard/broker/products">
              <PackageSearch className="mr-2 size-4" />
              Compare Products
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border text-neutral-700 hover:bg-muted">
            <Link href="/dashboard/broker/fca-verification">
              <ShieldCheck className="mr-2 size-4" />
              FCA Status
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Market Intelligence — dark green InsightPanel */}
      <InsightPanel
        title="Market Intelligence"
        eyebrow="Insight"
        icon={TrendingUp}
        action={{ label: "Run Batch Calculation", href: "/dashboard/broker/calculators" }}
      >
        The 5-year fixed rate has dropped by 0.25% this morning. You have 4 clients in AIP who
        could benefit from a product switch.
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
              Avg Base Rate
            </p>
            <p className="font-heading mt-1 text-3xl font-bold text-white">5.25%</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
              Avg Fixed (5yr)
            </p>
            <p className="font-heading mt-1 text-3xl font-bold text-brand-gold">4.82%</p>
          </div>
        </div>
      </InsightPanel>
    </div>
  );
}

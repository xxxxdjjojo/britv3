
import Link from "next/link";
import { KPICard } from "@/components/dashboard/provider/KPICard";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  GitBranch,
  Clock,
  PoundSterling,
  PackageSearch,
  ShieldCheck,
  ArrowRight,
  Plus,
} from "lucide-react";

const RECENT_ACTIVITY = [
  { id: 1, text: "New lead: Sarah Thompson enquired about remortgage", time: "12 min ago" },
  { id: 2, text: "Application submitted for James & Claire Reed", time: "2 hours ago" },
  { id: 3, text: "Offer accepted: Natwest 2-year fixed for M. Patel", time: "5 hours ago" },
  { id: 4, text: "FCA verification approved", time: "1 day ago" },
  { id: 5, text: "New review: 5 stars from David Collins", time: "2 days ago" },
];

export default function BrokerDashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Page Header — Stitch greeting pattern */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-brand-secondary-dark mb-1">
            Executive Overview
          </span>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground">
            Good morning, Alistair.
          </h1>
          <p className="mt-2 font-body text-sm text-neutral-500">
            Your pipeline is looking strong today with 6 new leads requiring attention.
          </p>
        </div>
        <Link href="/dashboard/broker/leads">
          <Button className="rounded-md bg-brand-primary px-6 py-3 font-heading text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2 gap-2 shrink-0">
            <Plus className="size-4" />
            Create New Application
          </Button>
        </Link>
      </div>

      {/* 4 KPI Cards — tonal surface styling from Stitch */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          title="Active Leads"
          value={12}
          icon={Inbox}
          trend={{ value: 3, direction: "up" }}
        />
        <KPICard
          title="Clients in Pipeline"
          value={8}
          icon={GitBranch}
          trend={{ value: 2, direction: "up" }}
        />
        <KPICard
          title="Avg Completion Time"
          value="34 days"
          icon={Clock}
        />
        <KPICard
          title="Revenue This Month"
          value="£12,450"
          icon={PoundSterling}
          trend={{ value: 15, direction: "up" }}
        />
      </div>

      {/* Two-Column Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 overflow-hidden">
          <div className="border-b border-neutral-100/60 dark:border-neutral-700/60 px-6 py-4">
            <h2 className="font-heading text-base font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="divide-y divide-neutral-100/60 dark:divide-neutral-700/60">
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className="px-6 py-3 flex items-start gap-3">
                <div className="mt-1 size-2 shrink-0 rounded-full bg-brand-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-foreground truncate">{item.text}</p>
                  <p className="font-body text-xs text-neutral-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 overflow-hidden">
          <div className="border-b border-neutral-100/60 dark:border-neutral-700/60 px-6 py-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-foreground">Pipeline Summary</h2>
            <Link
              href="/dashboard/broker/pipeline"
              className="font-body text-sm text-neutral-500 hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="p-6 space-y-3">
            {[
              { stage: "New Lead", count: 4, color: "bg-blue-500" },
              { stage: "Initial Consultation", count: 3, color: "bg-amber-500" },
              { stage: "Application Submitted", count: 2, color: "bg-purple-500" },
              { stage: "Underwriting", count: 1, color: "bg-orange-500" },
              { stage: "Approved", count: 1, color: "bg-success" },
              { stage: "Completed", count: 5, color: "bg-neutral-400" },
            ].map((item) => (
              <div key={item.stage} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`size-2.5 rounded-full ${item.color}`} />
                  <span className="font-body text-sm text-foreground">{item.stage}</span>
                </div>
                <span className="font-body text-sm font-semibold text-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 overflow-hidden">
        <div className="border-b border-neutral-100/60 dark:border-neutral-700/60 px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-foreground">Quick Actions</h2>
        </div>
        <div className="p-6 flex flex-wrap gap-3">
          <Link href="/dashboard/broker/leads">
            <Button className="rounded-lg bg-brand-secondary-light px-4 py-2 font-heading text-sm font-semibold text-brand-secondary-dark transition-colors hover:bg-brand-secondary-light/80 focus-visible:ring-2 focus-visible:ring-brand-secondary/30 focus-visible:ring-offset-2">
              <Inbox className="mr-2 size-4" />
              View Leads
            </Button>
          </Link>
          <Link href="/dashboard/broker/products">
            <Button variant="outline" className="rounded-lg border-neutral-200 font-body text-sm text-neutral-600 hover:bg-neutral-100 hover:text-foreground transition-colors dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800">
              <PackageSearch className="mr-2 size-4" />
              Compare Products
            </Button>
          </Link>
          <Link href="/dashboard/broker/fca-verification">
            <Button variant="outline" className="rounded-lg border-neutral-200 font-body text-sm text-neutral-600 hover:bg-neutral-100 hover:text-foreground transition-colors dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800">
              <ShieldCheck className="mr-2 size-4" />
              FCA Status
              <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

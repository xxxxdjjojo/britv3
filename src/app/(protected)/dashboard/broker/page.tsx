"use client";

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
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Mortgage Broker Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Here&apos;s an overview of your mortgage business today.
        </p>
      </div>

      {/* 4 KPI Cards */}
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
          value="\u00A312,450"
          icon={PoundSterling}
          trend={{ value: 15, direction: "up" }}
        />
      </div>

      {/* Two-Column Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Recent Activity</h2>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="mt-1.5 size-2 shrink-0 rounded-full bg-[#1B4D3E]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-700 truncate">{item.text}</p>
                  <p className="text-xs text-neutral-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900">Pipeline Summary</h2>
            <Link
              href="/dashboard/broker/pipeline"
              className="text-xs font-medium text-[#1B4D3E] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { stage: "New Lead", count: 4, color: "bg-blue-500" },
              { stage: "Initial Consultation", count: 3, color: "bg-amber-500" },
              { stage: "Application Submitted", count: 2, color: "bg-purple-500" },
              { stage: "Underwriting", count: 1, color: "bg-orange-500" },
              { stage: "Approved", count: 1, color: "bg-emerald-500" },
              { stage: "Completed", count: 5, color: "bg-neutral-400" },
            ].map((item) => (
              <div key={item.stage} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`size-2.5 rounded-full ${item.color}`} />
                  <span className="text-sm text-neutral-700">{item.stage}</span>
                </div>
                <span className="text-sm font-semibold text-neutral-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/broker/leads">
            <Button className="bg-[#1B4D3E] text-white hover:bg-[#163d31]">
              <Inbox className="mr-2 size-4" />
              View Leads
            </Button>
          </Link>
          <Link href="/dashboard/broker/products">
            <Button variant="outline" className="border-neutral-200 text-neutral-700 hover:bg-neutral-50">
              <PackageSearch className="mr-2 size-4" />
              Compare Products
            </Button>
          </Link>
          <Link href="/dashboard/broker/fca-verification">
            <Button variant="outline" className="border-neutral-200 text-neutral-700 hover:bg-neutral-50">
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

import { createClient } from "@/lib/supabase/server";
import { resolveProviderId } from "@/lib/provider/resolve-provider";
import Link from "next/link";
import {
  getProviderDashboardStats,
  getRecentActivity,
  getUpcomingJobs,
} from "@/services/provider/provider-dashboard-service";
import { getCashPosition } from "@/services/provider/provider-cash-position-service";
import { getSmartActions } from "@/services/provider/provider-smart-actions-service";
import { ActivityFeed } from "@/components/dashboard/provider/ActivityFeed";
import { UpcomingJobsList } from "@/components/dashboard/provider/UpcomingJobsList";
import { CashPositionWidget } from "@/components/dashboard/provider/CashPositionWidget";
import { SmartActionsCard } from "@/components/dashboard/provider/SmartActionsCard";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  Briefcase,
  Star,
  PoundSterling,
  FileText,
  CreditCard,
  Image,
  ArrowRight,
} from "lucide-react";

export default async function ProviderDashboardPage() {
  const supabase = await createClient();
  const { providerId, businessName } = await resolveProviderId(supabase);

  // Fetch dashboard data in parallel
  const [stats, activity, upcomingJobs, cashPosition, smartActions] = await Promise.all([
    getProviderDashboardStats(providerId, supabase),
    getRecentActivity(providerId, 8, supabase),
    getUpcomingJobs(providerId, 5, supabase),
    getCashPosition(providerId, supabase),
    getSmartActions(providerId, supabase),
  ]);

  const isVerified = stats.verificationStatus === "verified";
  const verificationProgress =
    stats.verificationStatus === "verified"
      ? 100
      : stats.verificationStatus === "pending"
        ? 65
        : 30;

  const monthlyEarnings = `£${(stats.totalEarningsPence / 100).toFixed(2)}`;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* ── Page Header — Stitch editorial: eyebrow above a large heading ────── */}
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Welcome back
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {businessName ?? "Provider Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* ── Verification Banner ──────────────────────────────────────────────── */}
      {!isVerified && (
        <div className="w-full rounded-xl bg-[#1B4D3E] p-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-3">
              <p className="text-sm font-semibold">
                {stats.verificationStatus === "pending"
                  ? "Verification in progress — complete remaining steps to unlock all features"
                  : "Complete your verification to start receiving job requests"}
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/80">
                  <span>Profile completion</span>
                  <span className="font-semibold text-white">{verificationProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${verificationProgress}%` }}
                  />
                </div>
              </div>
            </div>
            <Link href="/dashboard/provider/verification">
              <Button
                size="sm"
                className="shrink-0 bg-white text-[#1B4D3E] hover:bg-white/90 font-semibold"
              >
                Complete Verification
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Smart Action Suggestions ─────────────────────────────────────────── */}
      <SmartActionsCard actions={smartActions} />

      {/* ── 4 Stat Tiles — Stitch editorial chrome ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "New Leads", value: stats.totalLeads, icon: Inbox },
          { label: "Active Jobs", value: stats.activeJobs, icon: Briefcase },
          {
            label: "Pending Reviews",
            value: stats.averageRating > 0 ? `${stats.averageRating}★` : "—",
            icon: Star,
          },
          { label: "Total Earnings", value: monthlyEarnings, icon: PoundSterling },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-start gap-4 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-sm md:p-5"
          >
            <div className="bg-brand-primary/10 text-brand-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-5" />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.1em]">
                {label}
              </p>
              <p className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Cash Position Widget ─────────────────────────────────────────────── */}
      <CashPositionWidget cashPosition={cashPosition} />

      {/* ── Two-Column Grid: Activity + Upcoming Jobs ────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Recent Activity</h2>
          <ActivityFeed items={activity} />
        </div>

        {/* Upcoming Jobs */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900">Upcoming Jobs</h2>
            <Link
              href="/dashboard/provider/jobs/active"
              className="text-xs font-medium text-[#1B4D3E] hover:underline"
            >
              View all
            </Link>
          </div>
          <UpcomingJobsList jobs={upcomingJobs} />
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/provider/quotes/builder">
            <Button className="bg-[#1B4D3E] text-white hover:bg-[#163d31]">
              <FileText className="mr-2 size-4" />
              New Quote
            </Button>
          </Link>
          <Link href="/dashboard/provider/payments">
            <Button variant="outline" className="border-neutral-200 text-neutral-700 hover:bg-neutral-50">
              <CreditCard className="mr-2 size-4" />
              Log Payment
            </Button>
          </Link>
          <Link href="/dashboard/provider/portfolio">
            <Button variant="outline" className="border-neutral-200 text-neutral-700 hover:bg-neutral-50">
              <Image className="mr-2 size-4" />
              Add Portfolio Item
            </Button>
          </Link>
          <Link href="/dashboard/provider/reviews">
            <Button variant="outline" className="border-neutral-200 text-neutral-700 hover:bg-neutral-50">
              <Star className="mr-2 size-4" />
              Invite to Review
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

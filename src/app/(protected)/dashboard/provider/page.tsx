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
import { SectionHeader } from "@/components/dashboard/SectionHeader";
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
  type LucideIcon,
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
    <div className="flex flex-col gap-8 p-6 md:p-8 max-w-screen-xl">
      {/* ── Page Header — Stitch editorial: eyebrow above a large heading ────── */}
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Welcome back
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
          {businessName ?? "Provider Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* ── Verification Banner ──────────────────────────────────────────────── */}
      {!isVerified && (
        <div className="w-full rounded-xl bg-brand-primary p-5 text-white">
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
            <Button
              asChild
              size="sm"
              className="shrink-0 bg-white text-brand-primary hover:bg-white/90 font-semibold"
            >
              <Link href="/dashboard/provider/verification">
                Complete Verification
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── 4 KPI Tiles — Stitch editorial row ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            { label: "New Leads", value: stats.totalLeads, Icon: Inbox },
            { label: "Active Jobs", value: stats.activeJobs, Icon: Briefcase },
            {
              label: "Pending Reviews",
              value: stats.averageRating > 0 ? `${stats.averageRating}★` : "—",
              Icon: Star,
            },
            { label: "Total Earnings", value: monthlyEarnings, Icon: PoundSterling },
          ] satisfies { label: string; value: string | number; Icon: LucideIcon }[]
        ).map(({ label, value, Icon }) => (
          <div
            key={label}
            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                {label}
              </p>
              <p className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark">
                {value}
              </p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
              <Icon className="size-5" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Smart Action Suggestions ─────────────────────────────────────────── */}
      <SmartActionsCard actions={smartActions} />

      {/* ── Two-Column Grid: Upcoming Jobs + Activity Feed ───────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Jobs */}
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-6 shadow-sm">
          <SectionHeader
            title="Upcoming Jobs"
            action={{ label: "View all", href: "/dashboard/provider/jobs/active" }}
          />
          <UpcomingJobsList jobs={upcomingJobs} />
        </section>

        {/* Recent Activity */}
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-6 shadow-sm">
          <SectionHeader title="Recent Activity" />
          <ActivityFeed items={activity} />
        </section>
      </div>

      {/* ── Cash Position Widget ─────────────────────────────────────────────── */}
      <CashPositionWidget cashPosition={cashPosition} />

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <SectionHeader title="Quick Actions" className="mb-4" />
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-brand-primary text-white hover:bg-brand-primary/90">
            <Link href="/dashboard/provider/quotes/builder">
              <FileText className="mr-2 size-4" />
              New Quote
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border text-neutral-700 hover:bg-surface">
            <Link href="/dashboard/provider/payments">
              <CreditCard className="mr-2 size-4" />
              Log Payment
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border text-neutral-700 hover:bg-surface">
            <Link href="/dashboard/provider/portfolio">
              <Image className="mr-2 size-4" />
              Add Portfolio Item
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border text-neutral-700 hover:bg-surface">
            <Link href="/dashboard/provider/reviews">
              <Star className="mr-2 size-4" />
              Invite to Review
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

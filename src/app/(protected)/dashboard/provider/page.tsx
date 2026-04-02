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
import { UpcomingJobsList } from "@/components/dashboard/provider/UpcomingJobsList";
import { SmartActionsCard } from "@/components/dashboard/provider/SmartActionsCard";
import { ActivityFeed } from "@/components/dashboard/provider/ActivityFeed";
import {
  Briefcase,
  PoundSterling,
  FileText,
  ArrowRight,
  TrendingUp,
  Clock,
  MapPin,
  Filter,
} from "lucide-react";

export default async function ProviderDashboardPage() {
  let supabase;
  let providerId: string;
  let businessName: string | null;
  let stats: Awaited<ReturnType<typeof getProviderDashboardStats>>;
  let activity: Awaited<ReturnType<typeof getRecentActivity>>;
  let upcomingJobs: Awaited<ReturnType<typeof getUpcomingJobs>>;
  let cashPosition: Awaited<ReturnType<typeof getCashPosition>>;
  let smartActions: Awaited<ReturnType<typeof getSmartActions>>;

  try {
    supabase = await createClient();
    ({ providerId, businessName } = await resolveProviderId(supabase));

    [stats, activity, upcomingJobs, cashPosition, smartActions] = await Promise.all([
      getProviderDashboardStats(providerId, supabase),
      getRecentActivity(providerId, 8, supabase),
      getUpcomingJobs(providerId, 5, supabase),
      getCashPosition(providerId, supabase),
      getSmartActions(providerId, supabase),
    ]);
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error; // Re-throw Next.js redirects
    return (
      <div className="p-6 max-w-7xl">
        <h1 className="text-2xl font-bold font-heading text-emerald-900">Jobs Overview</h1>
        <p className="mt-4 text-sm text-neutral-500">Unable to load dashboard data. Please try refreshing the page.</p>
      </div>
    );
  }

  const isVerified = stats.verificationStatus === "verified";
  const verificationProgress =
    stats.verificationStatus === "verified"
      ? 100
      : stats.verificationStatus === "pending"
        ? 65
        : 30;

  const monthlyEarnings = `£${(stats.totalEarningsPence / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const pendingQuotes = stats.totalLeads ?? 0;

  return (
    <div className="p-6 space-y-8 max-w-7xl">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-emerald-900 tracking-tight">
            Jobs Overview
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {businessName ? businessName : "Your business at a glance"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/provider/quotes/builder"
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 transition-colors"
          >
            <FileText className="size-4" />
            New Quote
          </Link>
        </div>
      </div>

      {/* ── Verification Banner ──────────────────────────────────────────────── */}
      {!isVerified && (
        <div className="w-full rounded-2xl bg-brand-primary p-5 text-white">
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
            <Link
              href="/dashboard/provider/verification"
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-white/90 transition-colors"
            >
              Complete Verification
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Smart Action Suggestions ─────────────────────────────────────────── */}
      <SmartActionsCard actions={smartActions} />

      {/* ── KPI Bento Grid ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Active Jobs KPI */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Active Jobs</p>
            <h3 className="text-3xl font-bold text-emerald-900 font-heading">
              {String(stats.activeJobs).padStart(2, "0")}
            </h3>
            <p className="text-xs text-success flex items-center gap-1 font-semibold">
              <TrendingUp className="size-3" />
              +2 from last week
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-900">
            <Briefcase className="size-5" />
          </div>
        </div>

        {/* Earnings MTD KPI */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Earnings MTD</p>
            <h3 className="text-3xl font-bold text-emerald-900 font-heading">{monthlyEarnings}</h3>
            <p className="text-xs text-neutral-500 flex items-center gap-1 font-semibold">
              <Clock className="size-3" />
              82% of monthly target
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <PoundSterling className="size-5" />
          </div>
        </div>

        {/* Pending Quotes KPI */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Pending Quotes</p>
            <h3 className="text-3xl font-bold text-emerald-900 font-heading">
              {String(pendingQuotes).padStart(2, "0")}
            </h3>
            <p className="text-xs text-error flex items-center gap-1 font-semibold">
              <Clock className="size-3" />
              3 requiring follow-up
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <FileText className="size-5" />
          </div>
        </div>
      </section>

      {/* ── Action Bar + Job Filter Tabs ────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-neutral-200">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Link
            href="/dashboard/provider/jobs/active"
            className="whitespace-nowrap px-4 py-2 bg-emerald-900 text-white rounded-lg text-sm font-semibold shadow-sm"
          >
            All Jobs
          </Link>
          <Link
            href="/dashboard/provider/jobs/active"
            className="whitespace-nowrap px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm font-medium transition-colors"
          >
            Active
          </Link>
          <Link
            href="/dashboard/provider/jobs/active"
            className="whitespace-nowrap px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm font-medium transition-colors"
          >
            Upcoming
          </Link>
          <Link
            href="/dashboard/provider/jobs/active"
            className="whitespace-nowrap px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm font-medium transition-colors"
          >
            Completed
          </Link>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/dashboard/provider/jobs/active"
            className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50 text-neutral-700 transition-colors"
          >
            <Filter className="size-4" />
            Sort &amp; Filter
          </Link>
        </div>
      </section>

      {/* ── Upcoming Jobs Table ──────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-emerald-900 font-heading uppercase tracking-widest">
            Upcoming Jobs
          </h2>
          <Link
            href="/dashboard/provider/jobs/active"
            className="text-sm font-bold text-brand-secondary hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="p-6">
          <UpcomingJobsList jobs={upcomingJobs} />
        </div>
      </section>

      {/* ── Productivity Section ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Recent Activity / Schedule Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-emerald-900 font-heading">Recent Activity</h4>
            <Link
              href="/dashboard/provider/availability"
              className="text-sm font-bold text-brand-secondary hover:underline"
            >
              View Calendar
            </Link>
          </div>
          <ActivityFeed items={activity} />
        </div>

        {/* Service Coverage Map Card */}
        <div className="relative bg-emerald-900 rounded-2xl overflow-hidden min-h-[200px] flex items-end">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-emerald-950 opacity-80" />
          <div className="relative p-6 w-full">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest mb-1">
                  Service Coverage
                </p>
                <h4 className="text-xl font-bold text-white font-heading">
                  {businessName ?? "Your Service Area"}
                </h4>
                <p className="text-sm text-emerald-100/70 mt-1">
                  {upcomingJobs.length} jobs scheduled this week
                </p>
              </div>
              <Link
                href="/dashboard/provider/availability"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <MapPin className="size-4" />
                Availability
              </Link>
            </div>
            {/* Cash position snippet */}
            {cashPosition && (
              <div className="mt-4 flex items-center gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-emerald-300 font-medium">Cash In</p>
                  <p className="text-base font-bold text-white">
                    £{(cashPosition.receivedPence / 100).toLocaleString("en-GB")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-emerald-300 font-medium">Outstanding</p>
                  <p className="text-base font-bold text-white">
                    £{(cashPosition.invoicedPence / 100).toLocaleString("en-GB")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

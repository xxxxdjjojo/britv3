import type { Metadata } from "next";
import Link from "next/link";
import type { ServiceCategory, UrgencyLevel } from "@/types/marketplace";
import { CATEGORY_LABELS } from "@/lib/marketplace/category-labels";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Clock, Briefcase, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Job Board — Find Work Near You | Britestate",
  description:
    "Browse open jobs and RFQs posted by homeowners. Filter by trade category and urgency.",
};

const PAGE_SIZE = 20;

// Urgency badge config
const URGENCY_CONFIG: Record<
  UrgencyLevel,
  { label: string; className: string }
> = {
  emergency: {
    label: "Emergency",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  high: {
    label: "High Priority",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  normal: {
    label: "Normal",
    className:
      "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-light",
  },
  low: {
    label: "Low Priority",
    className:
      "bg-muted text-muted-foreground dark:bg-slate-800 dark:text-slate-400",
  },
};

/** Mask a full postcode to the outward code only (e.g. "TW7 4PQ" → "TW7 area") */
function maskPostcode(postcode: string): string {
  const area = postcode.trim().split(" ")[0];
  return `${area} area`;
}

/** Format budget range, or "Budget not specified" */
function formatBudget(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Budget not specified";
  if (min != null && max != null) {
    return `£${min.toLocaleString("en-GB")} – £${max.toLocaleString("en-GB")}`;
  }
  if (min != null) return `From £${min.toLocaleString("en-GB")}`;
  return `Up to £${max!.toLocaleString("en-GB")}`;
}

type SearchParams = Promise<{
  category?: string;
  urgency?: string;
  page?: string;
}>;

export default async function JobBoardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const categoryParam = params.category as ServiceCategory | undefined;
  const urgencyParam = params.urgency as UrgencyLevel | undefined;
  const pageParam = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (pageParam - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // Build query — filter expired + only open jobs
  let query = supabase
    .from("service_requests")
    .select(
      "id, title, service_category, property_postcode, urgency_level, budget_min, budget_max, status, expires_at, quote_count, created_at",
      { count: "exact" },
    )
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (categoryParam && categoryParam in CATEGORY_LABELS) {
    query = query.eq("service_category", categoryParam);
  }
  if (
    urgencyParam &&
    (["emergency", "high", "normal", "low"] as UrgencyLevel[]).includes(
      urgencyParam,
    )
  ) {
    query = query.eq("urgency_level", urgencyParam);
  }

  const { data: rawJobs, count } = await query;

  type JobRow = {
    id: string;
    title: string;
    service_category: ServiceCategory;
    property_postcode: string;
    urgency_level: UrgencyLevel;
    budget_min: number | null;
    budget_max: number | null;
    status: string;
    expires_at: string;
    quote_count: number;
    created_at: string;
  };

  const jobs: JobRow[] = (rawJobs ?? []) as JobRow[];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasPrev = pageParam > 1;
  const hasNext = pageParam < totalPages;

  // Build prev/next URLs preserving existing filters
  function buildUrl(p: number): string {
    const qs = new URLSearchParams();
    if (categoryParam) qs.set("category", categoryParam);
    if (urgencyParam) qs.set("urgency", urgencyParam);
    if (p > 1) qs.set("page", String(p));
    const q = qs.toString();
    return `/jobs${q ? `?${q}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-primary-dark to-brand-primary text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold mb-3 tracking-tight">
            Job Board
          </h1>
          <p className="text-xl text-white/80 max-w-xl mx-auto">
            Find Work Near You — browse open jobs posted by homeowners and landlords.
          </p>
        </div>
      </section>

      {/* Filter bar — SSR form, works without JS */}
      <section className="border-b border-border dark:border-slate-800 bg-surface dark:bg-slate-900/60 py-4 px-6">
        <div className="max-w-5xl mx-auto">
          <form
            action="/jobs"
            method="get"
            className="flex flex-wrap items-center gap-3"
          >
            {/* Category dropdown */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="category-filter"
                className="text-xs font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wide"
              >
                Category
              </label>
              <select
                id="category-filter"
                name="category"
                defaultValue={categoryParam ?? ""}
                className="px-3 py-2 rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">All categories</option>
                {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Urgency dropdown */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="urgency-filter"
                className="text-xs font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wide"
              >
                Urgency
              </label>
              <select
                id="urgency-filter"
                name="urgency"
                defaultValue={urgencyParam ?? ""}
                className="px-3 py-2 rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">All urgency levels</option>
                {(
                  ["emergency", "high", "normal", "low"] as UrgencyLevel[]
                ).map((u) => (
                  <option key={u} value={u}>
                    {URGENCY_CONFIG[u].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end mt-auto pt-5">
              <button
                type="submit"
                className="px-5 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors text-sm"
              >
                Filter
              </button>
            </div>

            {/* Clear filters link */}
            {(categoryParam || urgencyParam) && (
              <div className="flex flex-col justify-end mt-auto pt-5">
                <Link
                  href="/jobs"
                  className="px-5 py-2 text-muted-foreground hover:text-foreground dark:hover:text-slate-300 text-sm transition-colors"
                >
                  Clear
                </Link>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Results summary */}
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
        <p className="text-sm text-muted-foreground dark:text-slate-400">
          {totalCount > 0 ? (
            <>
              <span className="font-semibold text-foreground dark:text-slate-200">
                {totalCount.toLocaleString("en-GB")}
              </span>{" "}
              {totalCount === 1 ? "job" : "jobs"} found
              {categoryParam && (
                <>
                  {" "}in{" "}
                  <span className="font-medium">
                    {CATEGORY_LABELS[categoryParam]}
                  </span>
                </>
              )}
            </>
          ) : null}
        </p>
      </div>

      {/* Job cards grid */}
      <main className="max-w-5xl mx-auto px-6 pb-16 pt-4">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Briefcase className="w-14 h-14 text-muted-foreground dark:text-slate-600 mb-5" />
            <h2 className="text-xl font-heading font-bold text-foreground dark:text-slate-200 mb-2">
              No jobs found
            </h2>
            <p className="text-muted-foreground dark:text-slate-400 max-w-sm">
              No open jobs match your current filters — try expanding your
              service area or check back later.
            </p>
            {(categoryParam || urgencyParam) && (
              <Link
                href="/jobs"
                className="mt-6 px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors text-sm"
              >
                View all jobs
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {jobs.map((job) => {
              const urgency = URGENCY_CONFIG[job.urgency_level];
              const maskedLocation = maskPostcode(job.property_postcode);
              const budget = formatBudget(job.budget_min, job.budget_max);
              const postedAgo = formatDistanceToNow(new Date(job.created_at), {
                addSuffix: true,
              });

              return (
                <Link
                  key={job.id}
                  href={`/post-a-job/quote/${job.id}`}
                  className="group flex flex-col gap-3 bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-700 p-5 hover:border-brand-primary hover:shadow-md transition-all"
                >
                  {/* Title + badges row */}
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-foreground dark:text-white leading-snug group-hover:text-brand-primary transition-colors line-clamp-2">
                      {job.title}
                    </h2>
                    {/* Urgency badge */}
                    <span
                      className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${urgency.className}`}
                    >
                      {urgency.label}
                    </span>
                  </div>

                  {/* Category badge */}
                  <div>
                    <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary dark:bg-slate-800 dark:text-slate-300">
                      {CATEGORY_LABELS[job.service_category]}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground dark:text-slate-400">
                    {/* Location — masked postcode */}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {maskedLocation}
                    </span>

                    {/* Budget */}
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-foreground dark:text-slate-200">
                        {budget}
                      </span>
                    </span>
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center justify-between mt-auto pt-1 border-t border-border dark:border-slate-800">
                    {/* Posted date */}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground dark:text-slate-500">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {postedAgo}
                    </span>

                    {/* Quote count */}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground dark:text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      {job.quote_count === 0
                        ? "No quotes yet"
                        : job.quote_count === 1
                          ? "1 quote received"
                          : `${job.quote_count} quotes received`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {(hasPrev || hasNext) && (
          <nav
            className="flex items-center justify-between mt-10 pt-6 border-t border-border dark:border-slate-800"
            aria-label="Pagination"
          >
            {hasPrev ? (
              <Link
                href={buildUrl(pageParam - 1)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-foreground dark:text-slate-200 bg-white dark:bg-slate-900 border border-border dark:border-slate-700 rounded-lg hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                ← Previous
              </Link>
            ) : (
              <div />
            )}

            <span className="text-sm text-muted-foreground dark:text-slate-400">
              Page {pageParam} of {totalPages}
            </span>

            {hasNext ? (
              <Link
                href={buildUrl(pageParam + 1)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-foreground dark:text-slate-200 bg-white dark:bg-slate-900 border border-border dark:border-slate-700 rounded-lg hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                Next →
              </Link>
            ) : (
              <div />
            )}
          </nav>
        )}
      </main>

      {/* CTA for tradespeople who aren't signed in */}
      <section className="bg-gradient-to-r from-brand-primary-dark to-brand-primary py-14 px-6">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-2xl font-heading font-bold mb-3">
            Ready to send a quote?
          </h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto text-sm">
            Create a free provider account to quote on jobs in your area and
            grow your business with Britestate.
          </p>
          <Link
            href="/auth/signup?role=service_provider"
            className="inline-block px-8 py-3 bg-white text-brand-primary font-semibold rounded-lg hover:bg-surface transition-colors"
          >
            Join as a Tradesperson
          </Link>
        </div>
      </section>
    </div>
  );
}

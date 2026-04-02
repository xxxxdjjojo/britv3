import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCompletedJobs } from "@/services/provider/provider-job-service";
import type { CompletedJob } from "@/services/provider/provider-job-service";
import Link from "next/link";
import { CheckCircle, ChevronLeft, ChevronRight, Star } from "lucide-react";

export const metadata = { title: "Completed Jobs — Provider Dashboard" };

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StarRating({ rating }: Readonly<{ rating: number | null }>) {
  if (rating == null) {
    return (
      <span className="inline-block rounded-full bg-warning-light px-2.5 py-0.5 text-xs font-medium text-warning">
        Awaiting review
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm text-warning font-medium">
      <Star className="size-3.5 fill-warning text-warning" />
      {rating.toFixed(1)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function CompletedJobRow({ job }: Readonly<{ job: CompletedJob }>) {
  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50 transition">
      <td className="py-3 px-4">
        <Link
          href={`/dashboard/provider/jobs/${job.id}`}
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          {job.title}
        </Link>
      </td>
      <td className="py-3 px-4 text-sm text-neutral-600">{job.clientName}</td>
      <td className="py-3 px-4 text-sm text-neutral-500">{formatDate(job.completedAt)}</td>
      <td className="py-3 px-4 text-sm font-medium text-neutral-900 text-right">
        {formatAmount(job.totalAmountPence)}
      </td>
      <td className="py-3 px-4 text-right">
        <StarRating rating={job.rating} />
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Search form (inline, no client JS needed)
// ---------------------------------------------------------------------------

function SearchForm({ query }: Readonly<{ query: string }>) {
  return (
    <form method="GET" className="flex w-full max-w-xs gap-2">
      <input
        type="text"
        name="q"
        defaultValue={query}
        placeholder="Search jobs…"
        className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
      />
      <button
        type="submit"
        className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition"
      >
        Search
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function Pagination(props: Readonly<{
  page: number;
  total: number;
  pageSize: number;
  query: string;
}>) {
  const totalPages = Math.ceil(props.total / props.pageSize);
  if (totalPages <= 1) return null;

  const buildHref = (p: number) =>
    `?q=${encodeURIComponent(props.query)}&page=${p}`;

  return (
    <div className="flex items-center justify-between text-sm text-neutral-500">
      <span>
        Page {props.page} of {totalPages} ({props.total} jobs)
      </span>
      <div className="flex gap-2">
        {props.page > 1 ? (
          <Link
            href={buildHref(props.page - 1)}
            className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50 transition"
          >
            <ChevronLeft className="size-4" />
            Prev
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-300 cursor-not-allowed">
            <ChevronLeft className="size-4" />
            Prev
          </span>
        )}
        {props.page < totalPages ? (
          <Link
            href={buildHref(props.page + 1)}
            className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50 transition"
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-300 cursor-not-allowed">
            Next
            <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type SearchParams = Readonly<{
  q?: string;
  page?: string;
}>;

export default async function CompletedJobsPage(props: Readonly<{
  searchParams: Promise<SearchParams>;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.user_id ?? user.id;

  const params = await props.searchParams;
  const query = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const result = await getCompletedJobs(supabase, providerId, query, page, PAGE_SIZE);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-neutral-900">Completed Jobs</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Your full job history with earnings and review status.
          </p>
        </div>
        <SearchForm query={query} />
      </div>

      {result.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 py-16 text-center">
          <CheckCircle className="size-10 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-neutral-500">
            {query ? "No jobs match your search" : "No completed jobs yet"}
          </p>
          {!query && (
            <p className="mt-1 text-xs text-neutral-400">
              Completed jobs will appear here once marked as done.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Job Title
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Client
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Completed
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Review
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((job) => (
                  <CompletedJobRow key={job.id} job={job} />
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={result.page}
            total={result.total}
            pageSize={result.pageSize}
            query={query}
          />
        </>
      )}
    </div>
  );
}

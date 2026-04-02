import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveJobs } from "@/services/provider/provider-job-service";
import type { ActiveJob } from "@/services/provider/provider-job-service";
import Link from "next/link";
import { Briefcase } from "lucide-react";

export const metadata = { title: "Active Jobs — Provider Dashboard" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysRunningBadge(days: number): { label: string; className: string } {
  if (days <= 3) return { label: `${days}d`, className: "bg-success-light text-success" };
  if (days <= 7) return { label: `${days}d`, className: "bg-warning-light text-warning" };
  return { label: `${days}d`, className: "bg-error-light text-error" };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Desktop table row
// ---------------------------------------------------------------------------

function ActiveJobRow({ job }: Readonly<{ job: ActiveJob }>) {
  const { label, className } = daysRunningBadge(job.daysRunning);
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
      <td className="py-3 px-4 text-sm text-neutral-500">{formatDate(job.scheduledDate)}</td>
      <td className="py-3 px-4">
        <span className={["inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", className].join(" ")}>
          {label}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="inline-block rounded-full bg-info-light px-2.5 py-0.5 text-xs font-medium text-info capitalize">
          {job.status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm font-medium text-neutral-900 text-right">
        {formatAmount(job.totalAmountPence)}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Mobile card
// ---------------------------------------------------------------------------

function ActiveJobCard({ job }: Readonly<{ job: ActiveJob }>) {
  const { label, className } = daysRunningBadge(job.daysRunning);
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/dashboard/provider/jobs/${job.id}`}
          className="text-sm font-semibold text-brand-primary hover:underline leading-snug"
        >
          {job.title}
        </Link>
        <span
          className={["shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", className].join(" ")}
        >
          {label}
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">{job.clientName}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
        <span>Started: {formatDate(job.scheduledDate)}</span>
        <span className="font-semibold text-neutral-900">{formatAmount(job.totalAmountPence)}</span>
      </div>
      <div className="mt-2">
        <span className="inline-block rounded-full bg-info-light px-2.5 py-0.5 text-xs font-medium text-info capitalize">
          {job.status}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ActiveJobsPage() {
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

  const jobs = await getActiveJobs(supabase, providerId);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold font-heading text-neutral-900">Active Jobs</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Jobs currently confirmed or in progress.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 py-16 text-center">
          <Briefcase className="size-10 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-neutral-500">No active jobs</p>
          <p className="mt-1 text-xs text-neutral-400">
            Accept a lead to create your first job.{" "}
            <Link href="/dashboard/provider/jobs/leads" className="text-brand-primary hover:underline">
              Browse leads
            </Link>
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
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
                    Started
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Days Running
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <ActiveJobRow key={job.id} job={job} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {jobs.map((job) => (
              <ActiveJobCard key={job.id} job={job} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

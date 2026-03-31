import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getProviderLeads,
  getActiveJobs,
  type ProviderLead,
  type ActiveJob,
} from "@/services/provider/provider-job-service";

function fmtBudget(minPence: number | null, maxPence: number | null): string {
  if (!minPence && !maxPence) return "Budget TBC";
  const fmt = (p: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(p / 100);
  if (minPence && maxPence) return `${fmt(minPence)} – ${fmt(maxPence)}`;
  if (maxPence) return `Up to ${fmt(maxPence)}`;
  return fmt(minPence!);
}

function statusBadge(status: string): ReactNode {
  if (status === "active" || status === "in_progress") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        In progress
      </span>
    );
  }
  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
        Confirmed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
      {status}
    </span>
  );
}

function LeadCard({ lead }: { lead: ProviderLead }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-base font-semibold text-neutral-900">{lead.serviceCategory}</p>
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
          New lead
        </span>
      </div>

      {lead.description ? (
        <p className="line-clamp-2 text-sm text-neutral-600">{lead.description}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
        {lead.location ? <span>📍 {lead.location}</span> : null}
        <span>{fmtBudget(lead.budgetMinPence, lead.budgetMaxPence)}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <Link
          href={`/dashboard/provider/jobs/${lead.id}?action=accept`}
          className="flex-1 rounded-lg bg-brand-primary py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-primary/90"
        >
          Accept
        </Link>
        <Link
          href={`/dashboard/provider/jobs/${lead.id}?action=decline`}
          className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Decline
        </Link>
      </div>
    </div>
  );
}

function ActiveJobCard({ job }: { job: ActiveJob }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-base font-semibold text-neutral-900">{job.title}</p>
        {statusBadge(job.status)}
      </div>

      <p className="text-sm text-neutral-600">{job.clientName}</p>

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
        <span>{job.daysRunning === 0 ? "Started today" : `${job.daysRunning}d running`}</span>
        {job.scheduledDate ? (
          <span>
            Scheduled{" "}
            {new Date(job.scheduledDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <Link
          href={`/dashboard/provider/jobs/${job.id}`}
          className="block w-full rounded-lg border border-neutral-200 py-2.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          View job
        </Link>
      </div>
    </div>
  );
}

export default async function FieldJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = (providerProfile?.id as string | null) ?? user.id;

  const [leads, activeJobs] = await Promise.all([
    getProviderLeads(providerId, supabase),
    getActiveJobs(supabase, providerId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">Jobs</h1>
      </div>

      {/* Leads section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Leads
          </h2>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
            {leads.length}
          </span>
        </div>

        {leads.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 text-center shadow-sm">
            <p className="text-sm text-neutral-500">No new leads right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </section>

      {/* Active jobs section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Active
          </h2>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
            {activeJobs.length}
          </span>
        </div>

        {activeJobs.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 text-center shadow-sm">
            <p className="text-sm text-neutral-500">No active jobs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <ActiveJobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

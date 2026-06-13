import type { ReactNode } from "react";
import Link from "next/link";
import { MapPin, Phone, ArrowRight, Clock } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingJobs } from "@/services/provider/provider-job-service";

function formatDate(iso: Date): string {
  return iso.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status: string): ReactNode {
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        In progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
      Confirmed
    </span>
  );
}

export default async function FieldTodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolve provider id
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = (providerProfile?.id as string | null) ?? user.id;

  const jobs = await getUpcomingJobs(providerId, 20, supabase);
  const today = new Date();

  // Filter to just today's jobs
  const todayJobs = jobs.filter((job) => {
    if (!job.scheduledDate) return false;
    const jobDate = new Date(job.scheduledDate);
    return (
      jobDate.getFullYear() === today.getFullYear() &&
      jobDate.getMonth() === today.getMonth() &&
      jobDate.getDate() === today.getDate()
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-neutral-900">Today</h1>
        <p className="text-sm text-neutral-500">{formatDate(today)}</p>
      </div>

      {/* Job cards */}
      {todayJobs.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-base font-medium text-neutral-700">
            No jobs scheduled today
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Check your leads for new opportunities.
          </p>
          <Link
            href="/dashboard/provider/field/jobs"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
          >
            View leads <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {todayJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              {/* Time + status row */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700">
                  <Clock className="size-4 text-neutral-400" aria-hidden="true" />
                  {job.scheduledDate ? formatTime(job.scheduledDate) : "Time TBC"}
                </div>
                {statusBadge(job.status)}
              </div>

              {/* Service + client */}
              <p className="text-base font-semibold text-neutral-900">{job.serviceType}</p>
              <p className="mt-0.5 text-sm text-neutral-600">{job.clientName}</p>

              {/* Action row */}
              <div className="mt-3 flex flex-wrap gap-3">
                {job.address ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    <MapPin className="size-4 text-brand-primary" aria-hidden="true" />
                    Get directions
                  </a>
                ) : null}

                {/* Phone link placeholder — real phone comes from client data */}
                <Link
                  href={`/dashboard/provider/jobs/${job.id}`}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  <Phone className="size-4 text-brand-primary" aria-hidden="true" />
                  View details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick action */}
      <div className="pt-2">
        <Link
          href="/dashboard/provider/field/jobs"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#163d31] active:bg-[#123329]"
        >
          View leads <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

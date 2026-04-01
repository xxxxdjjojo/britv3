/**
 * Job milestones page -- renders the 5-step service job pipeline.
 * Server component that passes params to the client-side JobMilestones.
 */

import { JobMilestones } from "@/components/milestones/JobMilestones";

type PageProps = Readonly<{
  params: Promise<{ bookingId: string }>;
}>;

export default async function JobMilestonePage({ params }: PageProps) {
  const { bookingId } = await params;

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="font-heading text-xl font-semibold text-foreground">Service Job Milestones</h1>
        <p className="mt-1 font-body text-sm text-[--color-on-surface-variant]">Track the progress of your service job.</p>
      </div>
      <JobMilestones bookingId={bookingId} />
    </div>
  );
}

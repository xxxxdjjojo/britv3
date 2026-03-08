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
      <h1 className="text-2xl font-bold mb-6">Service Job Milestones</h1>
      <JobMilestones bookingId={bookingId} />
    </div>
  );
}

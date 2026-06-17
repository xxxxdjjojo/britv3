/**
 * Transaction milestones page -- renders the 8-step UK property pipeline.
 * Server component that passes params to the client-side TransactionMilestones.
 */

import { TransactionMilestones } from "@/components/milestones/TransactionMilestones";

type PageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function TransactionMilestonePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      {/* Editorial header — Stitch: eyebrow above heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Transactions
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark leading-tight">
            Transaction Milestones
          </h1>
        </div>
      </div>

      <TransactionMilestones transactionId={id} />
    </div>
  );
}

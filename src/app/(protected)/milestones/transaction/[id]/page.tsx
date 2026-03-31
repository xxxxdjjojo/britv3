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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-heading text-xl font-semibold text-foreground">
        Transaction Milestones
      </h1>
      <p className="mt-1 font-body text-sm text-neutral-500">
        Track the progress of your property transaction.
      </p>
      <div className="mt-6">
        <TransactionMilestones transactionId={id} />
      </div>
    </div>
  );
}

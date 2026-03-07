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
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Transaction Milestones</h1>
      <TransactionMilestones transactionId={id} />
    </div>
  );
}

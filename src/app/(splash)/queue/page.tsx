import type { Metadata } from "next";
import Link from "next/link";
import { getQueueStatus } from "@/services/waitlist/waitlist-service";
import { QueuePosition } from "@/components/coming-soon/QueuePosition";
import { ProgressBar } from "@/components/coming-soon/ProgressBar";
import { ReferralShare } from "@/components/coming-soon/ReferralShare";
import { RewardTiers } from "@/components/coming-soon/RewardTiers";

export const metadata: Metadata = {
  title: "Your place in the queue — TrueDeed",
  robots: { index: false, follow: false },
};

type QueuePageProps = Readonly<{
  searchParams: Promise<{ ref?: string }>;
}>;

function GracefulState({
  heading,
  body,
}: Readonly<{ heading: string; body: string }>) {
  return (
    <Card>
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight text-white">
        {heading}
      </h1>
      <p className="mt-3 text-base text-white/60">{body}</p>
      <Link
        href="/coming-soon"
        className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#FDCD74] px-7 text-sm font-semibold text-[#04130C] transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(253,205,116,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDCD74] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04130C]"
      >
        Join the early-access list
      </Link>
    </Card>
  );
}

function Card({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
      {children}
    </div>
  );
}

export default async function QueuePage({ searchParams }: QueuePageProps) {
  const { ref } = await searchParams;

  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-28 sm:px-10">
      {!ref ? (
        <GracefulState
          heading="No referral code"
          body="Looks like you landed here without a link. Join the list to claim your place in the queue."
        />
      ) : (
        <QueueContents code={ref} />
      )}
    </main>
  );
}

async function QueueContents({ code }: Readonly<{ code: string }>) {
  const status = await getQueueStatus(code).catch(() => null);

  if (!status) {
    return (
      <GracefulState
        heading="We couldn't find that code"
        body="That referral link doesn't match anyone on the list. Join below to get your own."
      />
    );
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-8">
      <Card>
        <QueuePosition status={status} />
        <div className="mt-8">
          <ProgressBar position={status.position} total={status.total} />
        </div>
      </Card>

      <Card>
        <div className="text-left">
          <ReferralShare code={status.code} />
        </div>
      </Card>

      <Card>
        <div className="text-left">
          <h2 className="mb-4 font-[family-name:var(--font-heading)] text-lg font-semibold text-white">
            Move up faster
          </h2>
          <RewardTiers />
        </div>
      </Card>
    </div>
  );
}

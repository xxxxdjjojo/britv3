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
    <div className="w-full max-w-lg rounded-2xl border border-[#1B4D3E]/10 bg-white p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:p-10">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight text-[#1B4D3E]">
        {heading}
      </h1>
      <p className="mt-3 text-base text-[#1B4D3E]/65">{body}</p>
      <Link
        href="/coming-soon"
        className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#1B4D3E] px-7 text-sm font-semibold text-white transition duration-300 ease-out hover:bg-[#003629] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A07D2E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04130C]"
      >
        Join the early-access list
      </Link>
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
    <div className="w-full max-w-4xl">
      <div className="mb-16">
        <QueuePosition status={status} />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-7">
          <div className="rounded-2xl border border-[#1B4D3E]/10 bg-white p-8 shadow-[0_18px_50px_rgba(0,0,0,0.14)] sm:p-10">
            <ReferralShare code={status.code} />
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#1B4D3E] p-8 text-white shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#2D7A5F] opacity-30 blur-3xl"
            />
            <h3 className="relative z-10 mb-6 font-[family-name:var(--font-heading)] text-xl font-semibold">
              Referral Progress
            </h3>
            <div className="relative z-10">
              <ProgressBar referralCount={status.referralCount} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-[#1B4D3E]/10 bg-white p-8 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
            <h3 className="mb-6 font-[family-name:var(--font-heading)] text-lg font-semibold text-[#1B4D3E]">
              Tier Rewards
            </h3>
            <RewardTiers referralCount={status.referralCount} />
          </div>
        </div>
      </div>
    </div>
  );
}

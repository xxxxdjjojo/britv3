import type { QueueStatus } from "@/types/waitlist";

type QueuePositionProps = Readonly<{
  status: QueueStatus;
}>;

export function QueuePosition({ status }: QueuePositionProps) {
  return (
    <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
      <div className="flex flex-col items-start text-left lg:col-span-7">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#FDCD74] px-4 py-1.5 text-[#5D4200]">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Zm-1.2 13.2L7.5 12l1.4-1.4 1.9 1.9 4.3-4.3L16.5 9.6l-5.7 5.6Z" />
          </svg>
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em]">
            You&apos;re on the list
          </span>
        </span>

        <h1 className="font-[family-name:var(--font-heading)] text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-7xl">
          You&apos;re in.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65 md:text-xl">
          Welcome to the inner circle. Your place is secured — share your link
          to climb the queue and unlock founder rewards.
        </p>
      </div>

      <div className="lg:col-span-5">
        <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#FDCD74]/15 blur-3xl"
          />
          <span className="relative z-10 mb-4 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#FDCD74]">
            Current Queue Position
          </span>
          <div className="relative z-10 font-[family-name:var(--font-heading)] text-7xl font-extrabold tabular-nums tracking-tighter text-white md:text-8xl">
            #{status.position.toLocaleString()}
          </div>
          <div
            aria-hidden
            className="relative z-10 my-5 h-1 w-20 rounded-full bg-[#FDCD74]"
          />
          <p className="relative z-10 max-w-[240px] text-sm font-medium text-white/60">
            of {status.total.toLocaleString()} on the list — moving up with every
            referral.
          </p>
        </div>
      </div>
    </section>
  );
}

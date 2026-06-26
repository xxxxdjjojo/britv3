import type { QueueStatus } from "@/types/waitlist";

type QueuePositionProps = Readonly<{
  status: QueueStatus;
}>;

export function QueuePosition({ status }: QueuePositionProps) {
  return (
    <section className="flex flex-col items-center text-center">
      <span
        aria-hidden
        className="mb-7 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2D7A5F] text-white shadow-[0_18px_45px_rgba(45,122,95,0.45)] ring-1 ring-white/15"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-9 w-9"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>

      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
        You&apos;re in. Here&apos;s your spot.
      </h1>

      <div className="mt-8 inline-block rounded-2xl border border-[#1B4D3E]/10 bg-white px-8 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[#1B4D3E]/55">
          Current position
        </p>
        <p className="font-[family-name:var(--font-heading)] text-4xl font-extrabold tabular-nums text-[#1B4D3E]">
          #{status.position.toLocaleString()}{" "}
          <span className="text-2xl font-normal text-[#1B4D3E]/40">
            of {status.total.toLocaleString()}
          </span>
        </p>
      </div>
    </section>
  );
}

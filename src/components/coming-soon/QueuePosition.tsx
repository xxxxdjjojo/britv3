import type { QueueStatus } from "@/types/waitlist";

type QueuePositionProps = Readonly<{
  status: QueueStatus;
}>;

export function QueuePosition({ status }: QueuePositionProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-sm font-medium uppercase tracking-[0.2em] text-[#FDCD74]/80">
        You&apos;re in line
      </span>
      <p className="font-[family-name:var(--font-heading)] text-6xl font-semibold leading-none tracking-tight text-white tabular-nums sm:text-8xl">
        #{status.position.toLocaleString()}
      </p>
      <p className="text-base text-white/60">for early access</p>
    </div>
  );
}

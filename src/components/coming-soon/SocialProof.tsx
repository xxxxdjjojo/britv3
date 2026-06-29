import { SOCIAL_PROOF_MIN_DISPLAY } from "@/lib/coming-soon/config";

type SocialProofProps = Readonly<{
  count: number;
}>;

const DOT_COUNT = 4;

export function SocialProof({ count }: SocialProofProps) {
  const message =
    count < SOCIAL_PROOF_MIN_DISPLAY
      ? "Join the early-access list"
      : `Join ${count.toLocaleString()}+ movers on the early-access list`;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-4">
      <span aria-hidden className="flex -space-x-3">
        {Array.from({ length: DOT_COUNT }).map((_, index) => (
          <span
            key={index}
            className="h-9 w-9 rounded-full border-2 border-[#04130C] bg-gradient-to-br from-[#FDCD74]/40 via-white/20 to-white/5 shadow-sm backdrop-blur"
          />
        ))}
      </span>
      <span className="text-xs uppercase tracking-[0.2em] text-white/55">
        {message}
      </span>
    </div>
  );
}

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
    <div className="flex items-center justify-center gap-3 text-sm text-white/60">
      <span aria-hidden className="flex -space-x-2">
        {Array.from({ length: DOT_COUNT }).map((_, index) => (
          <span
            key={index}
            className="h-6 w-6 rounded-full border border-[#04130C] bg-gradient-to-br from-white/30 to-white/5 backdrop-blur"
          />
        ))}
      </span>
      <span>{message}</span>
    </div>
  );
}

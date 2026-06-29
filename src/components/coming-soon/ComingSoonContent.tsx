import type { HeadlineVariant } from "@/components/coming-soon/variants";
import { WaitlistForm } from "@/components/coming-soon/WaitlistForm";

type ComingSoonContentProps = Readonly<{
  variant: HeadlineVariant;
  referredBy?: string | null;
}>;

export function ComingSoonContent({
  variant,
  referredBy,
}: ComingSoonContentProps) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-[#FDCD74]/30 bg-[#FDCD74]/10 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-[#FDCD74] backdrop-blur">
        <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FDCD74]" />
        Early Access
      </span>

      <h1 className="max-w-4xl text-balance font-[family-name:var(--font-heading)] text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[5rem]">
        {variant.headline}
      </h1>

      <p className="max-w-xl text-balance text-base leading-relaxed text-white/70 sm:text-lg">
        {variant.subhead}
      </p>

      <WaitlistForm
        variantId={variant.id}
        cta={variant.cta}
        referredBy={referredBy}
      />
    </div>
  );
}

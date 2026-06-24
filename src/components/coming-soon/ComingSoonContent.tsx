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
    <div className="flex flex-col items-center gap-7 text-center">
      <h1 className="max-w-4xl text-balance font-[family-name:var(--font-heading)] text-4xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
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

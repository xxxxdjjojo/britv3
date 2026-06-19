/**
 * MarketMapDisclaimer — mandatory verbatim disclaimer text per DESIGN.md §5.5.
 *
 * Rendered as visible text (not aria-label only) per DESIGN.md §15.
 * Contains the only permitted appearance of "£/m²" in the UI.
 */

import { cn } from "@/lib/utils";

type Props = Readonly<{
  className?: string;
}>;

export function MarketMapDisclaimer({ className }: Props) {
  return (
    <p
      className={cn(
        "font-sans text-[10px] font-normal leading-relaxed text-[#7A7A88]",
        className,
      )}
    >
      Based on registered sold-price transactions. This is not a £/m² estimate
      because floor-area data is not currently available.
    </p>
  );
}

import Link from "next/link";
import { Wrench, Zap, Hammer, PencilRuler, PaintRoller, Trees, Sparkles } from "lucide-react";

/**
 * "Local Support" trade chips shown on a property card. Each chip is a link to
 * the real tradespeople directory scoped to a service_category enum value —
 * NOT a claim that a specific provider is assigned to the listing. When a
 * postcode is supplied and the directory accepts it, it is appended so the
 * directory pre-filters by area.
 */

type ServiceCategorySlug =
  | "plumber"
  | "electrician"
  | "builder"
  | "architect"
  | "plasterer"
  | "painter"
  | "carpenter"
  | "landscaping"
  | "cleaning";

const CATEGORY_META: Record<
  ServiceCategorySlug,
  { label: string; Icon: typeof Wrench }
> = {
  plumber: { label: "Plumber", Icon: Wrench },
  electrician: { label: "Electrician", Icon: Zap },
  builder: { label: "Builder", Icon: Hammer },
  architect: { label: "Architect", Icon: PencilRuler },
  plasterer: { label: "Plasterer", Icon: PaintRoller },
  painter: { label: "Painter", Icon: PaintRoller },
  carpenter: { label: "Carpenter", Icon: Hammer },
  landscaping: { label: "Landscaping", Icon: Trees },
  cleaning: { label: "Cleaning", Icon: Sparkles },
};

const DEFAULT_CATEGORIES: ServiceCategorySlug[] = ["plumber", "electrician"];

type LocalSupportChipsProps = Readonly<{
  categories?: ServiceCategorySlug[];
  postcode?: string;
}>;

function buildHref(category: ServiceCategorySlug, postcode?: string): string {
  const params = new URLSearchParams({ category });
  if (postcode) params.set("postcode", postcode);
  return `/services/tradespeople?${params.toString()}`;
}

export function LocalSupportChips({
  categories = DEFAULT_CATEGORIES,
  postcode,
}: LocalSupportChipsProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50/60 px-6 py-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        Local Support
      </span>
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const meta = CATEGORY_META[category];
          if (!meta) return null; // ignore any unknown category instead of crashing
          const Icon = meta.Icon;
          return (
            <Link
              key={category}
              href={buildHref(category, postcode)}
              data-testid="local-support-chip"
              className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600 transition-colors hover:text-brand-primary"
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {meta.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

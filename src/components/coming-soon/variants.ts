// Single source of truth for the coming-soon headline A/B/C copy variants.
//
// Three positioning angles, served by the PostHog `coming_soon_headline`
// experiment (see src/lib/experiments.ts). Both the splash page (server-side
// variant assignment) and the unit tests import from here, so the copy never
// drifts between what we render and what we test.

export const HEADLINE_VARIANT_IDS = ["A", "B", "C"] as const;

export type HeadlineVariantId = (typeof HEADLINE_VARIANT_IDS)[number];

export type HeadlineVariant = Readonly<{
  id: HeadlineVariantId;
  /** Internal name for analytics + docs (not shown to users). */
  name: string;
  headline: string;
  subhead: string;
  cta: string;
}>;

export const HEADLINE_VARIANTS: Readonly<
  Record<HeadlineVariantId, HeadlineVariant>
> = {
  A: {
    id: "A",
    name: "Disruption",
    headline: "Estate agents are about to get very nervous.",
    subhead:
      "TrueDeed's AI finds your perfect home before it hits the market. Early access opens soon.",
    cta: "Get First Look",
  },
  B: {
    id: "B",
    name: "Empowerment",
    headline: "Your perfect British home. Found by intelligence, not chance.",
    subhead:
      "25,000+ verified listings. AI-matched to your life. Join the early-access list.",
    cta: "Join the Waitlist",
  },
  C: {
    id: "C",
    name: "Exclusivity",
    headline: "Something new is coming to UK property.",
    subhead:
      "A limited number of early-access accounts are being released. Secure yours now.",
    cta: "Reserve My Spot",
  },
} as const;

/** Control variant — used when PostHog is unavailable or returns nonsense. */
export const DEFAULT_VARIANT_ID: HeadlineVariantId = "B";

export function isHeadlineVariantId(value: unknown): value is HeadlineVariantId {
  return (
    typeof value === "string" &&
    (HEADLINE_VARIANT_IDS as readonly string[]).includes(value)
  );
}

/** Resolve a variant by id, falling back to the control variant. */
export function getVariant(id?: string | null): HeadlineVariant {
  return isHeadlineVariantId(id)
    ? HEADLINE_VARIANTS[id]
    : HEADLINE_VARIANTS[DEFAULT_VARIANT_ID];
}

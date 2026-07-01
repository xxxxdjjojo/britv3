/**
 * First-Time Buyer content hub — the curated 20-article pillar collection.
 *
 * Membership is the ordered slug list below; every member also carries
 * `hub: "first-time-buyer"` and a `journeyStage` on its `BlogPost`. The hub
 * landing page (`/blog/first-time-buyers`) and the hub tests read from here.
 */
import { getPostBySlug } from "./index";
import { JOURNEY_STAGES } from "./types";
import type { BlogPost, HubKey, JourneyStage } from "./types";

export const FTB_HUB_KEY: HubKey = "first-time-buyer";

export { JOURNEY_STAGES };
export type { JourneyStage };

/**
 * The 20 hub members, in curated reading order (pillar first). Two are reused
 * from the existing blog to avoid keyword cannibalisation; the rest are new.
 */
export const FTB_HUB_MEMBER_SLUGS = [
  "how-to-buy-a-house-uk",
  "how-much-deposit-to-buy-a-house-2026",
  "how-to-save-for-a-house-deposit-fast",
  "lifetime-isa-first-time-buyer",
  "mortgage-agreement-in-principle",
  "mortgage-affordability-how-much-can-i-borrow",
  "mortgage-interest-rates-uk-2026",
  "bad-credit-mortgage-first-time-buyer",
  "stamp-duty-first-time-buyer-guide-2026",
  "shared-ownership-scheme-worth-it-2026",
  "first-homes-scheme-first-time-buyers",
  "right-to-buy-rent-to-buy-schemes",
  "new-build-vs-old-house",
  "leasehold-vs-freehold-first-time-buyers",
  "gazumping-and-gazundering-explained",
  "conveyancing-timeline-explained",
  "homebuyer-survey-vs-building-survey",
  "property-chains-explained",
  "exchange-and-completion-explained",
  "what-happens-on-completion-day",
] as const;

export type HubMemberSlug = (typeof FTB_HUB_MEMBER_SLUGS)[number];

/** The hub members as full posts, in curated order. */
export function getHubPosts(): readonly BlogPost[] {
  return FTB_HUB_MEMBER_SLUGS.map((slug) => {
    const post = getPostBySlug(slug);
    if (!post) {
      throw new Error(`First-time-buyer hub references a missing post: ${slug}`);
    }
    return post;
  });
}

/** Hub members grouped by buyer-journey stage, preserving curated order. */
export function getHubPostsByStage(): Record<JourneyStage, readonly BlogPost[]> {
  const grouped = Object.fromEntries(
    JOURNEY_STAGES.map((stage) => [stage, [] as BlogPost[]]),
  ) as Record<JourneyStage, BlogPost[]>;

  for (const post of getHubPosts()) {
    const stage = post.journeyStage ?? "Consideration";
    grouped[stage].push(post);
  }

  return grouped;
}

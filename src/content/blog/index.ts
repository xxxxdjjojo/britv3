import type { BlogCategory, BlogPost } from "./types";
import { BLOG_CATEGORIES } from "./types";

import { post as stampDutyFirstTimeBuyer } from "./posts/stamp-duty-first-time-buyer-guide-2026";
import { post as winningOffer } from "./posts/winning-offer-competitive-market";
import { post as rentersRightsBill } from "./posts/renters-rights-bill-explained-2026";
import { post as tenantDeposit } from "./posts/tenant-deposit-protection-guide";
import { post as sellFaster } from "./posts/sell-your-home-faster-guide";
import { post as addValue } from "./posts/home-improvements-add-value";
import { post as hmoLicensing } from "./posts/hmo-licensing-landlord-guide-2026";
import { post as landlordTax } from "./posts/landlord-tax-changes-2026";
import { post as marketForecast } from "./posts/uk-property-market-forecast-2026";
import { post as risingPrices } from "./posts/fastest-rising-house-prices-2026";
import { post as leaseholdReform } from "./posts/leasehold-reform-act-flat-owners";
import { post as conveyancing } from "./posts/conveyancing-timeline-explained";
import { post as buyToLet } from "./posts/buy-to-let-still-worth-it-2026";
import { post as yieldVsGrowth } from "./posts/rental-yield-vs-capital-growth";

/** All blog posts, newest first. */
export const BLOG_POSTS: readonly BlogPost[] = [
  stampDutyFirstTimeBuyer,
  winningOffer,
  rentersRightsBill,
  tenantDeposit,
  sellFaster,
  addValue,
  hmoLicensing,
  landlordTax,
  marketForecast,
  risingPrices,
  leaseholdReform,
  conveyancing,
  buyToLet,
  yieldVsGrowth,
]
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export { BLOG_CATEGORIES };
export type { BlogPost, BlogCategory };

export function getAllPosts(): readonly BlogPost[] {
  return BLOG_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getAllSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}

export function getPostsByCategory(category: BlogCategory): readonly BlogPost[] {
  return BLOG_POSTS.filter((post) => post.category === category);
}

/** The featured post for a surface — explicit flag wins, else newest. */
export function getFeaturedPost(
  posts: readonly BlogPost[] = BLOG_POSTS,
): BlogPost | undefined {
  return posts.find((post) => post.featured) ?? posts[0];
}

/**
 * Related posts for an article: same category first, then most recent others,
 * never the article itself.
 */
export function getRelatedPosts(slug: string, limit = 3): readonly BlogPost[] {
  const current = getPostBySlug(slug);
  if (!current) return BLOG_POSTS.slice(0, limit);

  const sameCategory = BLOG_POSTS.filter(
    (post) => post.slug !== slug && post.category === current.category,
  );
  const others = BLOG_POSTS.filter(
    (post) => post.slug !== slug && post.category !== current.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

/** Convert a category to its URL slug, e.g. "Legal & Finance" → "legal-and-finance". */
export function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

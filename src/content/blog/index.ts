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

// ── First-Time Buyer content hub (18 new + stamp-duty & conveyancing reused) ──
import { post as howToBuyAHouse } from "./posts/how-to-buy-a-house-uk";
import { post as howMuchDeposit } from "./posts/how-much-deposit-to-buy-a-house-2026";
import { post as saveDepositFast } from "./posts/how-to-save-for-a-house-deposit-fast";
import { post as lifetimeIsa } from "./posts/lifetime-isa-first-time-buyer";
import { post as agreementInPrinciple } from "./posts/mortgage-agreement-in-principle";
import { post as affordability } from "./posts/mortgage-affordability-how-much-can-i-borrow";
import { post as interestRates } from "./posts/mortgage-interest-rates-uk-2026";
import { post as badCreditMortgage } from "./posts/bad-credit-mortgage-first-time-buyer";
import { post as sharedOwnership } from "./posts/shared-ownership-scheme-worth-it-2026";
import { post as firstHomesScheme } from "./posts/first-homes-scheme-first-time-buyers";
import { post as rightToBuy } from "./posts/right-to-buy-rent-to-buy-schemes";
import { post as newBuildVsOld } from "./posts/new-build-vs-old-house";
import { post as leaseholdVsFreehold } from "./posts/leasehold-vs-freehold-first-time-buyers";
import { post as gazumping } from "./posts/gazumping-and-gazundering-explained";
import { post as surveyTypes } from "./posts/homebuyer-survey-vs-building-survey";
import { post as propertyChains } from "./posts/property-chains-explained";
import { post as exchangeCompletion } from "./posts/exchange-and-completion-explained";
import { post as completionDay } from "./posts/what-happens-on-completion-day";

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
  howToBuyAHouse,
  howMuchDeposit,
  saveDepositFast,
  lifetimeIsa,
  agreementInPrinciple,
  affordability,
  interestRates,
  badCreditMortgage,
  sharedOwnership,
  firstHomesScheme,
  rightToBuy,
  newBuildVsOld,
  leaseholdVsFreehold,
  gazumping,
  surveyTypes,
  propertyChains,
  exchangeCompletion,
  completionDay,
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

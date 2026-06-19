/**
 * SEO content generators for service provider category landing pages.
 *
 * Pure functions only — no Supabase, no "use client" directive.
 * Used by the ISR category location page at /services/[category]/[location].
 */

import { brandConfig } from "@/config/brand";

/**
 * Capitalises the first letter of each word and replaces hyphens with spaces.
 * "south-london" → "South London", "isleworth" → "Isleworth"
 */
export function formatLocationDisplay(location: string): string {
  return location
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Converts a URL slug to a display-friendly category name.
 * "plumbers" → "Plumbers", "mortgage-brokers" → "Mortgage Brokers"
 */
export function formatCategoryDisplay(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export type CategoryPageMeta = {
  title: string;
  description: string;
  h1: string;
  intro: string;
};

/**
 * Returns SEO metadata strings for a category + location combination.
 * Both category and location should already be display-formatted (e.g. "Plumbers", "South London").
 */
export function generateCategoryPageMeta(
  category: string,
  location: string,
): CategoryPageMeta {
  return {
    title: `${category} in ${location} | ${brandConfig.displayName} Verified`,
    description: `Find verified ${category.toLowerCase()} in ${location}. Browse real reviews, compare prices, and get free quotes from the UK's most trusted tradespeople.`,
    h1: `Verified ${category} in ${location}`,
    intro: `Find top-rated local ${category.toLowerCase()} for all jobs in the ${location} area. Every professional is verified by ${brandConfig.displayName} — insurance checked, qualifications confirmed.`,
  };
}

export type FAQItem = {
  question: string;
  answer: string;
};

/**
 * Returns 4 FAQ items for a category + location combination.
 * Both category and location should already be display-formatted.
 */
export function generateCategoryFAQs(
  category: string,
  location: string,
): FAQItem[] {
  return [
    {
      question: `How much does a ${category.toLowerCase()} cost in ${location}?`,
      answer: `The cost varies by job complexity. Most ${category.toLowerCase()} in ${location} charge between £50–£150 per hour or offer fixed-price quotes for common jobs. Use ${brandConfig.displayName} to get free quotes from multiple verified professionals.`,
    },
    {
      question: `How do I find a reliable ${category.toLowerCase()} in ${location}?`,
      answer: `All ${category.toLowerCase()} on ${brandConfig.displayName} are verified — we check their insurance, qualifications, and reviews. Filter by rating, response time, and price to find the right professional for your needs.`,
    },
    {
      question: `Are all ${category.toLowerCase()} on ${brandConfig.displayName} verified?`,
      answer: `Yes. Every professional on ${brandConfig.displayName} goes through our Verification Centre: identity check, insurance verification, and qualification confirmation. Look for the ${brandConfig.displayName} Verified badge.`,
    },
    {
      question: `How quickly can I get a ${category.toLowerCase()} in ${location}?`,
      answer: `Many ${category.toLowerCase()} on ${brandConfig.displayName} respond within 2 hours. For emergencies, look for providers listing "Emergency callout available". Response times are displayed on each profile.`,
    },
  ];
}

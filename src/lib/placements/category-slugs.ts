/**
 * category-slugs.ts
 *
 * Friendly, SEO-oriented URL slugs for the /professionals/[town]/[category]
 * area pages, mapped to the underlying `service_category` enum values.
 */

import type { ServiceCategory } from "@/types/marketplace";

const SLUG_TO_CATEGORY: Record<string, ServiceCategory> = {
  conveyancers: "conveyancing",
  surveyors: "surveying",
  "mortgage-brokers": "mortgage_broker",
  "removals-companies": "moving_company",
  "home-inspectors": "home_inspector",
  cleaners: "cleaning",
  handymen: "handyman",
  plumbers: "plumber",
  electricians: "electrician",
  landscapers: "landscaping",
  "interior-designers": "interior_design",
  architects: "architect",
  "property-managers": "property_management",
  "pest-control": "pest_control",
  locksmiths: "locksmith",
  builders: "builder",
  plasterers: "plasterer",
  painters: "painter",
  carpenters: "carpenter",
};

const CATEGORY_TO_SLUG: Record<ServiceCategory, string> = Object.fromEntries(
  Object.entries(SLUG_TO_CATEGORY).map(([slug, cat]) => [cat, slug]),
) as Record<ServiceCategory, string>;

const CATEGORY_LABELS: Partial<Record<ServiceCategory, string>> = {
  conveyancing: "Conveyancers",
  surveying: "Surveyors",
  mortgage_broker: "Mortgage Brokers",
  moving_company: "Removals Companies",
  home_inspector: "Home Inspectors",
  property_management: "Property Managers",
  interior_design: "Interior Designers",
  pest_control: "Pest Control",
};

export function categoryFromSlug(slug: string): ServiceCategory | null {
  return SLUG_TO_CATEGORY[slug.toLowerCase()] ?? null;
}

export function slugForCategory(category: ServiceCategory): string {
  return CATEGORY_TO_SLUG[category] ?? `${category}s`;
}

/** Human, plural label, e.g. "Mortgage Brokers". */
export function categoryLabel(category: ServiceCategory): string {
  if (CATEGORY_LABELS[category]) return CATEGORY_LABELS[category] as string;
  const words = category.replace(/_/g, " ").split(" ");
  const titled = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return `${titled}s`;
}

export function townSlug(town: string): string {
  return town.trim().toLowerCase().replace(/\s+/g, "-");
}

export function townFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const PLACEMENT_CATEGORY_SLUGS = Object.keys(SLUG_TO_CATEGORY);

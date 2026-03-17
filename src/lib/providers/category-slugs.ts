/**
 * Category slug mappings for URL segments.
 *
 * CATEGORY_SLUGS maps DB enum values → URL-friendly plural slugs.
 * SLUG_TO_CATEGORY is the reverse map for route parameter resolution.
 *
 * All ServiceCategory enum values from src/types/marketplace.ts are included.
 */

import type { ServiceCategory } from "@/types/marketplace";

export const CATEGORY_SLUGS: Record<ServiceCategory, string> = {
  plumber: "plumbers",
  electrician: "electricians",
  handyman: "handymen",
  landscaping: "landscaping",
  interior_design: "interior-designers",
  architect: "architects",
  cleaning: "cleaning-services",
  pest_control: "pest-control",
  locksmith: "locksmiths",
  property_management: "property-management",
  home_inspector: "home-inspectors",
  moving_company: "removal-companies",
  conveyancing: "conveyancers",
  surveying: "surveyors",
  mortgage_broker: "mortgage-brokers",
  builder: "builders",
  plasterer: "plasterers",
  painter: "painters-decorators",
  carpenter: "carpenters",
  other: "other-services",
} as const;

export const SLUG_TO_CATEGORY: Record<string, ServiceCategory> = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([category, slug]) => [slug, category as ServiceCategory]),
) as Record<string, ServiceCategory>;

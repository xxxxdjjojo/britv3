/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/config/brand";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = appBaseUrl();
  const now = new Date();

  /* --- Static pages --- */
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/areas`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/guides/landlord-guide`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/help`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/press`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/coming-soon`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  /* --- Legal pages --- */
  const legalSlugs = [
    "terms", "privacy", "cookies", "accessibility", "complaints",
    "gdpr-rights", "aml-policy", "modern-slavery", "data-processing",
    "disclaimer", "acceptable-use", "ai-transparency", "fee-transparency",
    "review-policy",
    "fair-housing", "refunds", "third-party-services", "regulatory",
    "professional-standards",
  ];
  const legalPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/legal`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    ...legalSlugs.map((slug) => ({
      url: `${baseUrl}/legal/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];

  /* --- Service pages --- */
  const servicePages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/agents`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/surveyors`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/conveyancers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/mortgage-brokers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/architects`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  /* --- Tool/calculator pages --- */
  const toolPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/tools/mortgage-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/tools/stamp-duty-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/tools/buy-vs-rent`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/tools/rental-yield`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/tools/energy-bill-estimator`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/tools/moving-cost-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  /* --- Marketplace --- */
  const marketplacePages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/marketplace`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/area-prices`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/reviews`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
  ];

  /* --- Section 6: Area guide pages --- */
  const { getAllCitySlugs } = await import("@/services/areas/area-data-service");
  const { getNeighbourhoodsForCity } = await import("@/services/areas/mock-data/neighbourhoods");

  const citySlugs = getAllCitySlugs();
  const areaPages: MetadataRoute.Sitemap = [];

  for (const city of citySlugs) {
    areaPages.push({ url: `${baseUrl}/areas/${city}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
    areaPages.push({ url: `${baseUrl}/areas/${city}/stats`, lastModified: now, changeFrequency: "weekly", priority: 0.7 });
    const neighbourhoods = getNeighbourhoodsForCity(city);
    for (const n of neighbourhoods) {
      areaPages.push({ url: `${baseUrl}/areas/${city}/${n.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 });
    }
  }

  /* --- Blog posts (static content module) --- */
  const { getAllPosts } = await import("@/content/blog");
  const blogPostPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  /* --- Dynamic pages from database --- */
  let propertyPages: MetadataRoute.Sitemap = [];
  let agentPages: MetadataRoute.Sitemap = [];
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    // Property URLs use the listing slug, and slug/status live on `listings`
    // (not `properties`). Query active, non-deleted listings — anon-readable
    // via the listings_select_active RLS policy.
    const { data: listings } = await supabase
      .from("listings")
      .select("slug, updated_at")
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(5000);

    if (listings) {
      propertyPages = listings.map((l) => ({
        url: `${baseUrl}/properties/${l.slug}`,
        lastModified: new Date(l.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }

    const { data: agents } = await supabase
      .from("agent_profiles")
      .select("slug, updated_at")
      .eq("verified", true)
      .limit(2000);

    if (agents) {
      agentPages = agents.map((a) => ({
        url: `${baseUrl}/agents/${a.slug}`,
        lastModified: new Date(a.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error("[sitemap] DB query failed, using static-only:", err);
  }

  /* --- Memo Pivot v2 — programmatic SEO matrix --- */
  // Lazy require so the matrix tree-shakes out of production if disabled.
  const { buildDefaultMatrix } = await import("@/lib/seo/postcode-service-matrix");
  const programmaticPages: MetadataRoute.Sitemap = buildDefaultMatrix().map((p) => ({
    url: `${baseUrl}/services-near/${p.service}/${p.postcode.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  /* --- Memo Pivot v2 — new segment landing pages --- */
  const segmentLandingPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/sellers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/developers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/traders`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/fee-transparency`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  return [
    ...staticPages,
    ...legalPages,
    ...servicePages,
    ...segmentLandingPages,
    ...toolPages,
    ...marketplacePages,
    ...blogPostPages,
    ...areaPages,
    ...programmaticPages,
    ...propertyPages,
    ...agentPages,
  ];
}

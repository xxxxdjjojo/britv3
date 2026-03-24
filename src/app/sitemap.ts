import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  /* --- Static pages --- */
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/areas`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/help`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/press`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  /* --- Legal pages --- */
  const legalSlugs = [
    "terms", "privacy", "cookies", "accessibility", "complaints",
    "gdpr-rights", "aml-policy", "modern-slavery", "data-processing",
    "disclaimer", "acceptable-use",
  ];
  const legalPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/legal`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    ...legalSlugs.map((slug) => ({
      url: `${BASE_URL}/legal/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];

  /* --- Service pages --- */
  const servicePages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/agents`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/surveyors`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/conveyancers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/mortgage-brokers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/architects`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  /* --- Tool/calculator pages --- */
  const toolPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/tools/mortgage-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/tools/stamp-duty-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/tools/buy-vs-rent`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/tools/rental-yield`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/tools/energy-bill-estimator`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/tools/moving-cost-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  /* --- Marketplace --- */
  const marketplacePages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/marketplace`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/sold-prices`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/market-trends`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/reviews`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
  ];

  /* --- Dynamic pages from database --- */
  let propertyPages: MetadataRoute.Sitemap = [];
  let agentPages: MetadataRoute.Sitemap = [];
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: properties } = await supabase
      .from("properties")
      .select("slug, updated_at")
      .eq("status", "active")
      .limit(5000);

    if (properties) {
      propertyPages = properties.map((p) => ({
        url: `${BASE_URL}/properties/${p.slug}`,
        lastModified: new Date(p.updated_at),
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
        url: `${BASE_URL}/agents/${a.slug}`,
        lastModified: new Date(a.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error("[sitemap] DB query failed, using static-only:", err);
  }

  return [
    ...staticPages,
    ...legalPages,
    ...servicePages,
    ...toolPages,
    ...marketplacePages,
    ...propertyPages,
    ...agentPages,
  ];
}

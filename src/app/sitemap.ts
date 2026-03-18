import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo/config";

/** Regenerate the sitemap at most once per hour. */
export const revalidate = 3600;

const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: `${SITE_URL}`,
    changeFrequency: "daily",
    priority: 1.0,
  },
  ...[
    "/about",
    "/contact",
    "/search",
    "/marketplace",
    "/areas",
    "/blog",
    "/tools",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  })),
  ...[
    "/legal/terms",
    "/legal/privacy",
    "/legal/cookies",
    "/legal/accessibility",
    "/legal/complaints",
    "/legal/disclaimer",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly" as const,
    priority: 0.3,
  })),
  ...["/pricing", "/how-it-works", "/careers"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  })),
];

const serviceCategories: MetadataRoute.Sitemap = [
  "/services/plumbers",
  "/services/electricians",
  "/services/builders",
  "/services/estate-agents",
  "/services/mortgage-brokers",
  "/services/surveyors",
  "/services/conveyancers",
  "/services/architects",
].map((path) => ({
  url: `${SITE_URL}${path}`,
  changeFrequency: "weekly" as const,
  priority: 0.7,
}));

async function getPropertyRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("listings")
      .select("slug, updated_at")
      .eq("status", "active");

    return (data ?? []).map((listing) => ({
      url: `${SITE_URL}/properties/${listing.slug}`,
      lastModified: new Date(listing.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    return [];
  }
}

async function getBlogRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cms_articles")
      .select("slug, updated_at")
      .eq("status", "published");

    return (data ?? []).map((article) => ({
      url: `${SITE_URL}/blog/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [propertyRoutes, blogRoutes] = await Promise.all([
    getPropertyRoutes(),
    getBlogRoutes(),
  ]);

  return [
    ...staticRoutes,
    ...serviceCategories,
    ...propertyRoutes,
    ...blogRoutes,
  ];
}

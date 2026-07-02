/**
 * Canonical tradesperson public profile — /services/pro/[slug]
 *
 * The single, category-free URL for an individual tradesperson's public profile.
 * Every trader card across the app links here via `tradespersonProfilePath`, so
 * this route's existence is what makes those links resolve instead of 404.
 *
 * The render is delegated to the shared <TradespersonProfile> so this route and
 * the legacy /services/[category]/[slug] route stay identical.
 */

import type { Metadata } from "next";
import { fetchProviderBySlug } from "@/services/providers/public-profile-service";
import { TradespersonProfile } from "@/components/providers/TradespersonProfile";
import { CATEGORY_SLUGS, SLUG_TO_CATEGORY } from "@/lib/providers/category-slugs";
import { tradespersonProfilePath } from "@/lib/providers/profile-path";
import type { ServiceCategory } from "@/types/marketplace";

// Live data — render on demand.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const provider = await fetchProviderBySlug(slug);
  if (!provider) {
    return { title: "Provider Not Found | TrueDeed" };
  }

  const categorySlug =
    (provider.services?.[0] && CATEGORY_SLUGS[provider.services[0] as ServiceCategory]) ||
    "other-services";
  const displayCategory = String(SLUG_TO_CATEGORY[categorySlug] ?? "tradesperson").replace(
    /_/g,
    " ",
  );

  return {
    title: `${provider.business_name} | ${displayCategory} | TrueDeed`,
    description:
      provider.description ??
      `View ${provider.business_name}'s profile, reviews, portfolio and pricing on TrueDeed.`,
    alternates: { canonical: tradespersonProfilePath(slug) },
    openGraph: {
      title: provider.business_name,
      description: provider.description ?? undefined,
      type: "profile",
      images: provider.profiles.avatar_url ? [{ url: provider.profiles.avatar_url }] : [],
    },
  };
}

export default async function TradespersonProfilePage({ params }: Params) {
  const { slug } = await params;
  return TradespersonProfile({ slug });
}

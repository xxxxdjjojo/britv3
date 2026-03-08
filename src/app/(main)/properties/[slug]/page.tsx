import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getListingBySlug,
  getPriceHistory,
  incrementViewCount,
} from "@/services/listings/listing-service";
import { PropertyDetail } from "@/components/properties/PropertyDetail";

type PropertyPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const result = await getListingBySlug(supabase, slug);

  if (!result) {
    return { title: "Property Not Found | Britestate" };
  }

  const { property, media } = result;
  const description = property.description?.slice(0, 160) ?? "";
  const ogImage = media?.[0]?.url ?? undefined;

  return {
    title: `${property.title} | Britestate`,
    description,
    openGraph: {
      title: property.title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const result = await getListingBySlug(supabase, slug);

  if (!result) {
    notFound();
  }

  const { listing, property, media } = result;

  // Increment view count (fire-and-forget)
  incrementViewCount(supabase, listing.id).catch(() => {
    // Non-blocking -- view count is best-effort
  });

  // Fetch price history
  let priceHistory: import("@/types/property").PriceHistory[] = [];
  try {
    priceHistory = await getPriceHistory(supabase, listing.id);
  } catch {
    priceHistory = [];
  }

  return (
    <PropertyDetail
      listing={listing}
      property={property}
      media={media ?? []}
      priceHistory={priceHistory}
    />
  );
}

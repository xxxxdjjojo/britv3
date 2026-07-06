import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getPropertyBySlug,
  getPriceHistory,
  getPropertyViewCount,
  getSaveState,
} from "@/services/properties/property-detail-service";
import {
  buildPropertyView,
  formatPropertyType,
  type PropertyViewerState,
} from "@/lib/properties/build-property-view";
import { BuyPropertyPage } from "@/components/properties/buy/BuyPropertyPage";
import { RentPropertyPage } from "@/components/properties/rent/RentPropertyPage";
import { getExistingViewingId } from "@/services/viewings/viewings-service";

// ---------------------------------------------------------------------------
// Rendering mode
// ---------------------------------------------------------------------------
// This route renders per-user data via cookies()-backed Supabase auth
// (save state, existing viewing, view count). Marking it dynamic prevents the
// DYNAMIC_SERVER_USAGE error that a static/ISR render produces when cookies()
// is read (previously: HTTP 500 on a direct GET). See PERFORMANCE_AUDIT.md R2.

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPropertyBySlug(slug);

  if (!detail) {
    return {
      title: "Property not found | TrueDeed",
    };
  }

  const { property } = detail;
  const bedsLabel = `${property.bedrooms}-bed`;
  const typeLabel = formatPropertyType(property.propertyType);
  const cityLabel = property.city;

  return {
    title: `${bedsLabel} ${typeLabel} in ${cityLabel} | TrueDeed`,
    description: (property.description ?? "").slice(0, 160),
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://truedeed.co.uk"}/properties/${slug}`,
    },
    openGraph: {
      title: `${bedsLabel} ${typeLabel} in ${cityLabel} | TrueDeed`,
      description: (property.description ?? "").slice(0, 160),
      images: detail.media
        .filter((m) => m.mediaType === "image")
        .slice(0, 1)
        .map((m) => ({ url: m.url, alt: m.altText ?? "" })),
    },
  };
}

// ---------------------------------------------------------------------------
// Page — data layer + Buy/Rent template branch
// ---------------------------------------------------------------------------

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const detail = await getPropertyBySlug(slug);

  if (!detail) {
    notFound();
  }

  const { listing, property } = detail;

  // Status gate — DRAFT and ARCHIVED should never be visible
  if (listing.status === "draft" || listing.status === "archived") {
    notFound();
  }

  const priceHistory = await getPriceHistory(listing.id);
  const view = buildPropertyView(detail, priceHistory);

  // ---------------------------------------------------------------------------
  // Per-user state (non-critical — degrade gracefully)
  // ---------------------------------------------------------------------------

  const [viewerCount, saveState, { data: authData }] = await Promise.all([
    getPropertyViewCount(supabase, property.id).catch(() => 0),
    supabase.auth.getUser().then(({ data }) =>
      data.user
        ? getSaveState(supabase, data.user.id, listing.id).catch(() => ({
            saved: false,
            notes: null,
          }))
        : Promise.resolve({ saved: false, notes: null }),
    ),
    supabase.auth.getUser(),
  ]);

  const currentUserId = authData?.user?.id ?? null;

  let existingViewingId: string | null = null;
  if (currentUserId) {
    existingViewingId = await getExistingViewingId(supabase, currentUserId, listing.id);
  }

  const saveCount =
    ((listing as Record<string, unknown>)["favorite_count"] as number) ?? 0;

  const canBookViewing =
    !view.isInactiveStatus && (listing.status as string) !== "draft";

  const viewer: PropertyViewerState = {
    viewerCount,
    saveState,
    currentUserId,
    existingViewingId,
    saveCount,
    canBookViewing,
  };

  return listing.listingType === "rent" ? (
    <RentPropertyPage view={view} viewer={viewer} supabase={supabase} />
  ) : (
    <BuyPropertyPage view={view} viewer={viewer} supabase={supabase} />
  );
}

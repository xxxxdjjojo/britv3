import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Zap,
  Home,
  FileText,
  Tag,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Gallery } from "@/components/properties/Gallery";
import { FloorPlan } from "@/components/properties/FloorPlan";
import { PriceHistoryChart } from "@/components/properties/detail/PriceHistoryChart";
import type { EpcRating, ListingType } from "@/types/property";
import type { PriceHistoryEntry } from "@/services/properties/property-detail-service";
import { createClient } from "@/lib/supabase/server";
import {
  getPropertyBySlug,
  getPriceHistory,
  getPropertyViewCount,
  getSaveState,
} from "@/services/properties/property-detail-service";

// Wave 4 — ROI components (left column)
import { RenovationROIPanel } from "@/components/properties/roi/RenovationROIPanel";
import { WhatIfFloorPlan } from "@/components/properties/roi/WhatIfFloorPlan";

// Wave 6 — Hero media components
import { VirtualTourViewer } from "@/components/properties/detail/VirtualTourViewer";
import { VideoTourPlayer } from "@/components/properties/detail/VideoTourPlayer";

// Wave 6 — Local area intelligence widgets
import { TransportWidget } from "@/components/properties/detail/TransportWidget";
import { SchoolCatchmentWidget } from "@/components/properties/detail/SchoolCatchmentWidget";
import { BroadbandWidget } from "@/components/properties/detail/BroadbandWidget";
import { FloodRiskWidget } from "@/components/properties/detail/FloodRiskWidget";
import { CrimeStatsChart } from "@/components/properties/detail/CrimeStatsChart";

// Wave 6 — Sidebar calculators
import { MortgageCalculator } from "@/components/calculators/MortgageCalculator";
import { SdltCalculator } from "@/components/calculators/SdltCalculator";

// Wave 5 — Conversion components
import { AgentCardSidebar } from "@/components/properties/detail/AgentCardSidebar";
import { BookViewingModal } from "@/components/properties/detail/BookViewingModal";
import AskAgentForm from "@/components/properties/detail/AskAgentForm";
import { SimilarProperties } from "@/components/properties/detail/SimilarProperties";
import { RecommendedTradespeople } from "@/components/properties/detail/RecommendedTradespeople";
import { SavePropertyButton } from "@/components/properties/detail/SavePropertyButton";
import { SocialProofBadge } from "@/components/properties/detail/SocialProofBadge";
import { PropertyDetailActions } from "@/components/properties/detail/PropertyDetailActions";
import { extractFeatureItems } from "@/lib/properties/extract-features";
import { buildPropertyJsonLd } from "@/lib/seo/property-jsonld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { isFeatureEnabled } from "@/lib/features";

// ---------------------------------------------------------------------------
// Static params — ISR handles on-demand rendering
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return [];
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const detail = await getPropertyBySlug(slug);

  if (!detail) {
    return {
      title: "Property not found | Britestate",
    };
  }

  const { property } = detail;
  const bedsLabel = `${property.bedrooms}-bed`;
  const typeLabel = formatPropertyType(property.propertyType);
  const cityLabel = property.city;

  return {
    title: `${bedsLabel} ${typeLabel} in ${cityLabel} | Britestate`,
    description: (property.description ?? "").slice(0, 160),
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk"}/properties/${slug}`,
    },
    openGraph: {
      title: `${bedsLabel} ${typeLabel} in ${cityLabel} | Britestate`,
      description: (property.description ?? "").slice(0, 160),
      images: detail.media
        .filter((m) => m.mediaType === "image")
        .slice(0, 1)
        .map((m) => ({ url: m.url, alt: m.altText ?? "" })),
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPropertyType(raw: string): string {
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatTenure(raw: string | null): string {
  if (!raw) return "Unknown";
  return formatPropertyType(raw);
}


function formatPriceHistory(
  rows: PriceHistoryEntry[],
): { date: string; price: number; event?: string }[] {
  return rows.map((row, i) => ({
    date: String(row.changedAt).slice(0, 10),
    price: row.newPrice,
    event: i === rows.length - 1 ? "Listed" : row.newPrice < row.oldPrice ? "Reduced" : undefined,
  }));
}

/** Extract the postcode district prefix, e.g. "TW7 9AB" → "TW7" */
function postcodeDistrict(postcode: string): string {
  return postcode.trim().split(" ")[0] ?? postcode.trim();
}

const EPC_BANDS = ["A", "B", "C", "D", "E", "F", "G"] as const;
const EPC_COLORS: Record<string, string> = {
  A: "bg-green-600",
  B: "bg-green-500",
  C: "bg-lime-500",
  D: "bg-yellow-400",
  E: "bg-orange-400",
  F: "bg-orange-600",
  G: "bg-red-600",
};
const EPC_BG_LIGHT: Record<string, string> = {
  A: "bg-green-50",
  B: "bg-green-50",
  C: "bg-lime-50",
  D: "bg-yellow-50",
  E: "bg-orange-50",
  F: "bg-orange-50",
  G: "bg-red-50",
};
const EPC_TEXT_COLORS: Record<string, string> = {
  A: "text-green-700",
  B: "text-green-600",
  C: "text-lime-600",
  D: "text-yellow-600",
  E: "text-orange-600",
  F: "text-orange-700",
  G: "text-red-700",
};

// ---------------------------------------------------------------------------
// Page
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

  const { listing, property, media, agent } = detail;

  // Status gate — DRAFT and ARCHIVED should never be visible
  if (listing.status === "draft" || listing.status === "archived") {
    notFound();
  }

  const isInactiveStatus = ["sold", "sold_stc", "let", "withdrawn"].includes(listing.status);

  const priceHistory = await getPriceHistory(listing.id);

  // ---------------------------------------------------------------------------
  // Derived display values
  // ---------------------------------------------------------------------------

  const address = [
    property.addressLine1,
    property.addressLine2,
    property.city,
    property.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const rentSuffix = listing.listingType === "rent"
    ? ` ${listing.rentFrequency === "weekly" ? "pw" : "pcm"}`
    : "";
  const priceFormatted = `£${listing.price.toLocaleString("en-GB")}${rentSuffix}`;
  const sqft = property.squareFootage ?? 0;
  const propertyTypeLabel = formatPropertyType(property.propertyType);
  const tenureLabel = formatTenure(property.tenure ?? null);
  const epc: EpcRating | "N/A" = (property.epcRating as EpcRating | null) ?? "N/A";
  const councilTax = property.councilTaxBand
    ? `Band ${property.councilTaxBand}`
    : "Unknown";
  const features = extractFeatureItems(property.features);

  const images = media
    .filter((m) => m.mediaType === "image")
    .map((m) => ({ src: m.url, alt: m.altText ?? "" }));

  const floors = media
    .filter((m) => m.mediaType === "floor_plan")
    .map((m) => ({ label: m.caption ?? "Floor Plan", imageUrl: m.url }));

  const priceHistoryFormatted = formatPriceHistory(
    [...priceHistory].reverse(),
  );

  const priceReduced = priceHistoryFormatted.length > 1 &&
    priceHistoryFormatted[priceHistoryFormatted.length - 1].price <
    priceHistoryFormatted[0].price;
  const originalPrice = priceReduced ? priceHistoryFormatted[0].price : null;

  // Floor plan URL for WhatIfFloorPlan (first floor plan media, if any)
  const floorPlanUrl = floors.length > 0 ? (floors[0]?.imageUrl ?? null) : null;

  // Virtual tour and video URLs from media array (media types may be extended)
  const virtualTourUrl = media.find((m) => (m.mediaType as string) === "virtual_tour")?.url ?? null;
  const videoTourUrl = media.find((m) => (m.mediaType as string) === "video")?.url ?? null;

  // Postcode district for SimilarProperties
  const district = postcodeDistrict(property.postcode);

  // Canonical property URL for Share modal
  const propertyUrl =
    typeof process !== "undefined"
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk"}/properties/${listing.slug ?? listing.id}`
      : `/properties/${listing.slug ?? listing.id}`;

  // Property title for share / metadata
  const propertyTitle = `${property.bedrooms}-bed ${propertyTypeLabel} in ${property.city}`;

  // ---------------------------------------------------------------------------
  // Parallel data fetches (non-critical — degrade gracefully)
  // ---------------------------------------------------------------------------

  const [viewerCount, saveState, { data: authData }] = await Promise.all([
    getPropertyViewCount(supabase, property.id).catch(() => 0),
    // Save state requires an authenticated user — fetch auth first
    supabase.auth.getUser().then(({ data }) =>
      data.user
        ? getSaveState(supabase, data.user.id, listing.id).catch(() => ({ saved: false, notes: null }))
        : Promise.resolve({ saved: false, notes: null }),
    ),
    supabase.auth.getUser(),
  ]);

  const currentUserId = authData?.user?.id ?? null;

  // Existing viewing check (only meaningful for authenticated users)
  let existingViewingId: string | null = null;
  if (currentUserId) {
    const { data: viewingRow } = await supabase
      .from("property_viewings")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", currentUserId)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();
    existingViewingId = (viewingRow as { id: string } | null)?.id ?? null;
  }

  // Save count for social proof badge (use listing.favorite_count as seed)
  const saveCount = (listing as Record<string, unknown>)["favorite_count"] as number ?? 0;

  // Agent details
  const agentId = agent?.id ?? "";
  const agentName = agent?.displayName || "Agent";

  // Whether booking a viewing makes sense for this listing status
  const canBookViewing = !isInactiveStatus && (listing.status as string) !== "draft";

  return (
    <div className="min-h-screen bg-neutral-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPropertyJsonLd(detail)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: property.city, path: `/properties?location=${encodeURIComponent(property.city)}` },
            { name: address, path: `/properties/${listing.slug ?? listing.id}` },
          ])),
        }}
      />
      {isInactiveStatus && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            This property is marked as <strong>{listing.status.replace(/_/g, " ")}</strong> and is no longer available for viewings.
          </div>
        </div>
      )}
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500 flex-wrap">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span aria-hidden="true" className="text-neutral-300">/</span>
          <Link
            href={`/properties?location=${encodeURIComponent(property.city)}`}
            className="hover:text-neutral-900 transition-colors"
          >
            {property.city}
          </Link>
          <span aria-hidden="true" className="text-neutral-300">/</span>
          <span aria-current="page" className="text-neutral-700 truncate max-w-[200px]">
            {address}
          </span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 lg:pb-12">
        {/* Gallery */}
        <Gallery images={images} className="mt-2 mb-8" />

        {/* Hero media — Virtual Tour & Video */}
        {(virtualTourUrl || videoTourUrl) && (
          <div className="grid gap-6 sm:grid-cols-2 mb-6">
            {virtualTourUrl && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Virtual Tour</h3>
                <VirtualTourViewer tourUrl={virtualTourUrl} />
              </div>
            )}
            {videoTourUrl && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Video Tour</h3>
                <VideoTourPlayer videoUrl={videoTourUrl} />
              </div>
            )}
          </div>
        )}

        {/* Sticky info bar */}
        <div className="sticky top-16 z-20 -mx-4 px-4 py-4 bg-white/95 backdrop-blur-md border-b border-neutral-200 mb-8 lg:static lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:px-0 lg:py-0 lg:mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {/* Price */}
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-3xl font-bold text-neutral-900 font-heading tracking-tight">{priceFormatted}</p>
                {priceReduced && originalPrice != null && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                    Reduced from £{originalPrice.toLocaleString("en-GB")}
                  </span>
                )}
              </div>

              <p className="flex items-center gap-1.5 text-sm text-neutral-500 mt-1">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-xs">{address}</span>
              </p>

              {/* Key stats pills */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
                  <Bed className="size-4" aria-hidden="true" />
                  {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
                  <Bath className="size-4" aria-hidden="true" />
                  {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
                </span>
                {sqft > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
                    <Square className="size-4" aria-hidden="true" />
                    {sqft.toLocaleString("en-GB")} sq ft
                  </span>
                )}
              </div>

              {/* Social proof badge */}
              <div className="mt-3">
                <SocialProofBadge
                  propertyId={property.id}
                  initialViewerCount={viewerCount}
                  initialSaveCount={saveCount}
                />
              </div>
            </div>

            {/* Action buttons: Save, Share, Report */}
            <div className="flex gap-2 items-center flex-wrap">
              <SavePropertyButton
                propertyId={property.id}
                initialSaved={saveState.saved}
                initialNotes={saveState.notes}
              />
              <PropertyDetailActions
                propertyId={property.id}
                propertyUrl={propertyUrl}
                propertyTitle={propertyTitle}
              />
              {canBookViewing && (
                <a
                  href="#book-viewing"
                  className="shrink-0 gap-1.5 inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-brand-primary text-white min-h-[44px] px-4 lg:hidden hover:opacity-90 transition-opacity"
                  aria-label="Book a viewing"
                >
                  <CalendarIcon className="size-4" aria-hidden="true" />
                  Book
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 65/35 grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ── MAIN CONTENT ── */}
          <div className="space-y-14 min-w-0">
            {/* About this property */}
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-2xl font-bold text-neutral-900 font-heading tracking-tight mb-6">
                About this property
              </h2>
              <div className="text-base leading-relaxed text-neutral-600 whitespace-pre-line">
                {property.description}
              </div>
              {features.length > 0 && (
                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5" aria-label="Property features">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-neutral-700">
                      <span className="size-2 rounded-full bg-brand-primary shrink-0" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Property details grid */}
            <section aria-labelledby="details-heading">
              <h2 id="details-heading" className="text-2xl font-bold text-neutral-900 font-heading tracking-tight mb-6">
                Property details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: <Home className="size-4" />,
                    label: "Type",
                    value: propertyTypeLabel,
                  },
                  {
                    icon: <FileText className="size-4" />,
                    label: "Tenure",
                    value: tenureLabel,
                  },
                  {
                    icon: <Tag className="size-4" />,
                    label: "Council Tax",
                    value: councilTax,
                  },
                  {
                    icon: <Zap className="size-4" />,
                    label: "EPC Rating",
                    value: epc,
                  },
                  {
                    icon: <Bed className="size-4" />,
                    label: "Bedrooms",
                    value: String(property.bedrooms),
                  },
                  {
                    icon: <Bath className="size-4" />,
                    label: "Bathrooms",
                    value: String(property.bathrooms),
                  },
                  ...(property.receptionRooms != null ? [{
                    icon: <Home className="size-4" />,
                    label: "Receptions",
                    value: String(property.receptionRooms),
                  }] : []),
                  {
                    icon: <CalendarIcon className="size-4" />,
                    label: "Listed",
                    value: new Date(listing.listedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                  },
                  ...(property.tenure === "leasehold" && property.leaseRemainingYears != null ? [{
                    icon: <FileText className="size-4" />,
                    label: "Lease Remaining",
                    value: `${property.leaseRemainingYears} years`,
                  }] : []),
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-xs"
                  >
                    <span className="text-neutral-400 mt-0.5 shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-xs text-neutral-500 mb-0.5">
                        {item.label}
                      </p>
                      <p className="font-semibold text-sm text-neutral-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Floor Plan */}
            {floors.length > 0 && (
              <section aria-labelledby="floorplan-heading">
                <h2 id="floorplan-heading" className="text-2xl font-bold text-neutral-900 font-heading tracking-tight mb-6">
                  Floor plans
                </h2>
                <FloorPlan floors={floors} />
              </section>
            )}

            {/* Location map placeholder */}
            <section aria-labelledby="location-heading">
              <h2 id="location-heading" className="text-2xl font-bold text-neutral-900 font-heading tracking-tight mb-6">
                Location
              </h2>
              <div className="relative h-64 rounded-2xl overflow-hidden bg-neutral-200 flex items-center justify-center">
                <MapPin className="size-10 text-neutral-400 opacity-60" aria-hidden="true" />
                <p className="absolute bottom-3 right-3 text-sm text-neutral-600 bg-white/80 backdrop-blur-sm rounded-lg px-2.5 py-1">
                  {address}
                </p>
              </div>
            </section>

            {/* Price History */}
            {priceHistoryFormatted.length > 0 && (
              <section aria-labelledby="price-history-heading">
                <h2 id="price-history-heading" className="text-2xl font-bold text-neutral-900 font-heading tracking-tight mb-6">
                  Price history
                </h2>
                <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-neutral-200" />}>
                  <PriceHistoryChart
                    postcode={property.postcode}
                    history={priceHistoryFormatted}
                  />
                </Suspense>
              </section>
            )}

            {/* EPC display — using EPCDisplay component */}
            {property.epcRating && (
              <section aria-labelledby="epc-heading">
                <h2 id="epc-heading" className="text-2xl font-bold text-neutral-900 font-heading tracking-tight mb-6">
                  Energy Performance
                </h2>
                {/* Import EPCDisplay inline since it's already in detail/ */}
                <div className="rounded-2xl bg-neutral-50 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-white flex items-center justify-center shadow-xs shrink-0">
                        <Zap className="size-4 text-neutral-600" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">Energy Performance Certificate</p>
                        {property.epcScore != null && (
                          <p className="text-xs text-neutral-500">{property.epcScore}/100 points</p>
                        )}
                      </div>
                    </div>
                    <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 min-w-[52px] ${EPC_BG_LIGHT[epc as keyof typeof EPC_BG_LIGHT] ?? "bg-neutral-50"}`}>
                      <span className={`text-2xl font-bold leading-none ${EPC_TEXT_COLORS[epc as keyof typeof EPC_TEXT_COLORS] ?? "text-neutral-700"}`}>
                        {epc}
                      </span>
                      <span className="text-xs text-neutral-500 mt-0.5">Current</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-2">Energy efficiency rating</p>
                    <div className="flex items-stretch gap-0.5 h-8 rounded-lg overflow-hidden">
                      {EPC_BANDS.map((band) => (
                        <div
                          key={band}
                          className={`flex flex-1 items-center justify-center text-xs font-bold text-white ${EPC_COLORS[band]} ${band === epc ? "scale-y-110 shadow-md z-10 relative" : "opacity-50"}`}
                          aria-label={`Band ${band}${band === epc ? " (current)" : ""}`}
                        >
                          {band}
                        </div>
                      ))}
                    </div>
                  </div>
                  <a
                    href={`https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode?postcode=${encodeURIComponent(property.postcode)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline"
                    aria-label="View full EPC certificate on gov.uk (opens in new tab)"
                  >
                    View full EPC certificate ↗
                  </a>
                  {listing.listingType === "rent" && epc !== "N/A" && ["D", "E", "F", "G"].includes(epc) && (
                    <p className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                      <strong>MEES Notice:</strong> Rental properties in England and Wales may require a minimum EPC rating of C under upcoming regulations. This property currently holds a rating of {epc}.
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* ── LOCAL AREA INTELLIGENCE (Wave 6) ── */}
            {isFeatureEnabled("local_area_intelligence") && (
              <section aria-labelledby="local-area-heading">
                <h2 id="local-area-heading" className="text-2xl font-bold text-neutral-900 font-heading tracking-tight mb-6">
                  Local area
                </h2>
                <Suspense
                  fallback={
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className="h-48 bg-neutral-200 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <TransportWidget nearbyStations={[]} />
                    <SchoolCatchmentWidget schools={[]} />
                    <BroadbandWidget
                      downloadMbps={null}
                      uploadMbps={null}
                      provider={null}
                      connectionType={null}
                    />
                    <FloodRiskWidget riskLevel={null} source={null} />
                    <CrimeStatsChart stats={[]} boroughAvg={null} />
                  </div>
                </Suspense>
              </section>
            )}

            {/* ── ROI SECTION (Wave 4) ── */}
            {listing.listingType === "sale" && (
              <section id="roi-section" aria-labelledby="roi-heading">
                <h2 id="roi-heading" className="text-2xl font-bold text-neutral-900 font-heading tracking-tight mb-6">
                  Renovation ROI
                </h2>
                <div className="space-y-6">
                  <Suspense
                    fallback={
                      <div className="rounded-2xl bg-neutral-50 p-6 animate-pulse">
                        <div className="h-5 w-48 bg-neutral-200 rounded mb-4" />
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="h-28 bg-neutral-200 rounded-2xl" />
                          ))}
                        </div>
                      </div>
                    }
                  >
                    <RenovationROIPanel property={property as unknown as import("@/types/property").Property} supabase={supabase} />
                  </Suspense>

                  {/* WhatIf Floor Plan — shows overlay when a renovation type is selected */}
                  {floorPlanUrl && (
                    <WhatIfFloorPlan
                      floorPlanUrl={floorPlanUrl}
                      selectedRenovationType={null}
                    />
                  )}
                </div>
              </section>
            )}

            {/* ── ASK AGENT FORM (Wave 5) — anchored for AgentCardSidebar link ── */}
            <section id={`ask-agent-${property.id}`} aria-labelledby="contact-agent-heading">
              <h2 id="contact-agent-heading" className="text-2xl font-bold text-neutral-900 font-heading tracking-tight mb-6">
                Contact the agent
              </h2>
              <AskAgentForm
                propertyId={property.id}
                agentId={agentId}
                agentName={agentName}
              />
            </section>

            {/* ── BOTTOM SECTIONS ── */}

            {/* Similar Properties */}
            <Suspense
              fallback={
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              }
            >
              <SimilarProperties
                propertyId={property.id}
                postcodeDistrict={district}
                listingType={listing.listingType as ListingType}
                price={listing.price}
                propertyType={property.propertyType}
              />
            </Suspense>
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            {/* Agent card (Wave 5) */}
            <Suspense
              fallback={
                <div className="rounded-2xl bg-white border border-neutral-200 p-5 animate-pulse space-y-4 shadow-sm">
                  <div className="flex gap-3 items-center">
                    <div className="size-14 rounded-full bg-neutral-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-neutral-100 rounded" />
                      <div className="h-3 w-24 bg-neutral-100 rounded" />
                    </div>
                  </div>
                  <div className="h-px bg-neutral-100" />
                  <div className="h-11 bg-neutral-100 rounded-xl" />
                </div>
              }
            >
              <AgentCardSidebar agentId={agentId} propertyId={property.id} />
            </Suspense>

            {/* Apply to Rent */}
            {listing.listingType === "rent" && listing.status === "active" && (
              <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-semibold text-neutral-900">Interested in renting?</h3>
                <p className="text-xs text-neutral-500">
                  Submit a rental application to the landlord directly.
                </p>
                <Link
                  href={currentUserId
                    ? `/dashboard/renter/applications/apply/${property.id}`
                    : `/login?redirectTo=${encodeURIComponent(`/dashboard/renter/applications/apply/${property.id}`)}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary text-white text-sm font-semibold min-h-[44px] px-4 hover:opacity-90 transition-opacity"
                  aria-label="Apply to rent this property"
                >
                  <FileText className="size-4" aria-hidden="true" />
                  Apply to Rent
                </Link>
              </div>
            )}

            {/* Book Viewing (Wave 5) */}
            {canBookViewing && (
              <div id="book-viewing">
                <BookViewingModal
                  propertyId={property.id}
                  propertyStatus={listing.status}
                  existingViewingId={existingViewingId}
                />
              </div>
            )}

            {/* Mortgage Calculator (Wave 6) */}
            <div className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm">
              <MortgageCalculator initialPrice={listing.price} />
            </div>

            {/* SDLT Calculator (Wave 6) */}
            <div className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm">
              <SdltCalculator initialPrice={listing.price} />
            </div>

            {/* Local Experts */}
            <Suspense fallback={null}>
              <RecommendedTradespeople postcode={property.postcode} />
            </Suspense>
          </aside>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-4 lg:hidden">
        <div>
          <p className="font-bold text-xl text-neutral-900 font-heading">{priceFormatted}</p>
          <p className="text-xs text-neutral-500">
            {property.bedrooms} bed · {propertyTypeLabel}
          </p>
        </div>
        {canBookViewing && (
          <a
            href="#book-viewing"
            className="shrink-0 gap-1.5 inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-brand-primary text-white min-h-[44px] px-4 hover:opacity-90 transition-opacity"
            aria-label="Book a viewing"
          >
            <CalendarIcon className="size-4" aria-hidden="true" />
            Book Viewing
          </a>
        )}
      </div>
    </div>
  );
}

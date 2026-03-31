import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle2,
  Wifi,
  Car,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Gallery } from "@/components/properties/Gallery";
import { FloorPlan } from "@/components/properties/FloorPlan";
import { PriceHistory } from "@/components/properties/PriceHistory";
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
  A: "bg-emerald-700",
  B: "bg-emerald-500",
  C: "bg-yellow-400",
  D: "bg-orange-400",
  E: "bg-orange-600",
  F: "bg-red-500",
  G: "bg-red-700",
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
    <div className="min-h-screen bg-[#faf9f8]">
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

      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        {/* Inactive status banner */}
        {isInactiveStatus && (
          <div className="pt-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              This property is marked as <strong>{listing.status.replace(/_/g, " ")}</strong> and is no longer available for viewings.
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 py-5 text-xs font-medium text-[#707974] overflow-x-auto whitespace-nowrap"
        >
          <Link href="/" className="hover:text-[#1B4D3E] transition-colors">Home</Link>
          <ChevronRight className="size-3.5" />
          <Link
            href={`/properties?location=${encodeURIComponent(property.city)}`}
            className="hover:text-[#1B4D3E] transition-colors"
          >
            {property.city}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-[#1a1c1c] truncate max-w-[200px]">{address}</span>
        </nav>

        {/* Gallery */}
        <Gallery images={images} className="mb-6" />

        {/* Hero media — Virtual Tour & Video */}
        {(virtualTourUrl || videoTourUrl) && (
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            {virtualTourUrl && (
              <div>
                <h3 className="text-sm font-semibold text-[#1a1c1c] mb-2">Virtual Tour</h3>
                <VirtualTourViewer tourUrl={virtualTourUrl} />
              </div>
            )}
            {videoTourUrl && (
              <div>
                <h3 className="text-sm font-semibold text-[#1a1c1c] mb-2">Video Tour</h3>
                <VideoTourPlayer videoUrl={videoTourUrl} />
              </div>
            )}
          </div>
        )}

        {/* Sticky key info bar */}
        <div className="sticky top-16 z-30 -mx-4 md:-mx-8 px-4 md:px-8 py-4 bg-white/90 backdrop-blur-xl border-b border-neutral-100 mb-8 transition-shadow duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-[1440px] mx-auto">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1B4D3E]">
                {priceFormatted}
              </h1>
              {priceReduced && originalPrice != null && (
                <Badge className="mt-1 bg-green-100 text-green-800 border-0 text-xs">
                  Reduced from £{originalPrice.toLocaleString("en-GB")}
                </Badge>
              )}
              <p className="text-[#404945] font-medium text-sm flex items-center gap-1 mt-1">
                <MapPin className="size-3.5 shrink-0" />
                {address}
              </p>
              {/* Social proof */}
              <div className="mt-1.5">
                <SocialProofBadge
                  propertyId={property.id}
                  initialViewerCount={viewerCount}
                  initialSaveCount={saveCount}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              {/* Key stats */}
              <div className="flex items-center gap-5 text-sm text-[#404945]">
                <div className="flex items-center gap-1.5">
                  <Bed className="size-4 text-[#D4A853]" />
                  <span className="font-semibold text-[#1a1c1c]">{property.bedrooms} Bed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bath className="size-4 text-[#D4A853]" />
                  <span className="font-semibold text-[#1a1c1c]">{property.bathrooms} Bath</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Home className="size-4 text-[#D4A853]" />
                  <span className="font-semibold text-[#1a1c1c]">{propertyTypeLabel}</span>
                </div>
                {sqft > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Square className="size-4 text-[#D4A853]" />
                    <span className="font-semibold text-[#1a1c1c]">
                      {sqft.toLocaleString("en-GB")} sq ft
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {canBookViewing && (
                  <a
                    href="#book-viewing"
                    className="bg-[#1B4D3E] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all hover:bg-[#003629]"
                  >
                    Book Viewing
                  </a>
                )}
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
              </div>
            </div>
          </div>
        </div>

        {/* 65/35 grid */}
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] pb-24 lg:pb-10">
          {/* ── MAIN CONTENT ── */}
          <div className="space-y-12 min-w-0">

            {/* About this property */}
            <section>
              <h2 className="text-xl font-heading font-bold text-[#1B4D3E] mb-5">
                About this property
              </h2>
              <div className="text-[#404945] leading-relaxed text-sm whitespace-pre-line">
                {property.description}
              </div>
              {features.length > 0 && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-3 p-4 rounded-xl bg-[#f4f3f2]"
                    >
                      <CheckCircle2 className="size-4 text-[#1B4D3E] shrink-0 mt-0.5 fill-[#1B4D3E] stroke-white" />
                      <p className="text-sm font-medium text-[#1a1c1c]">{f}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Property details grid */}
            <section>
              <h2 className="text-xl font-heading font-bold text-[#1B4D3E] mb-5">
                Property details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {[
                  { label: "Property Type", value: propertyTypeLabel },
                  { label: "Tenure", value: tenureLabel },
                  { label: "Council Tax", value: councilTax },
                  { label: "EPC Rating", value: epc !== "N/A" ? epc : "Not rated" },
                  { label: "Bedrooms", value: String(property.bedrooms) },
                  { label: "Bathrooms", value: String(property.bathrooms) },
                  ...(property.receptionRooms != null
                    ? [{ label: "Receptions", value: String(property.receptionRooms) }]
                    : []),
                  {
                    label: "Listed",
                    value: new Date(listing.listedDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }),
                  },
                  ...(property.tenure === "leasehold" && property.leaseRemainingYears != null
                    ? [{ label: "Lease Remaining", value: `${property.leaseRemainingYears} years` }]
                    : []),
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-[#404945] font-bold">
                      {item.label}
                    </p>
                    {item.label === "EPC Rating" && epc !== "N/A" ? (
                      <span className="inline-block bg-green-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                        EPC {epc}
                      </span>
                    ) : (
                      <p className="text-sm font-semibold text-[#1a1c1c]">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Floor Plans */}
            {floors.length > 0 && (
              <section>
                <h2 className="text-xl font-heading font-bold text-[#1B4D3E] mb-5">Floor Plans</h2>
                <FloorPlan floors={floors} />
              </section>
            )}

            {/* Location */}
            <section>
              <div className="flex justify-between items-end mb-5">
                <h2 className="text-xl font-heading font-bold text-[#1B4D3E]">
                  Location &amp; Connectivity
                </h2>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#D4A853] flex items-center gap-1 hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>
              <div className="h-64 rounded-2xl overflow-hidden bg-[#f4f3f2] relative flex items-center justify-center">
                <MapPin className="size-8 text-[#c0c9c3]" />
                <p className="absolute bottom-3 right-3 text-xs text-[#707974] bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  {address}
                </p>
              </div>
            </section>

            {/* Market Insights / Price History */}
            {priceHistoryFormatted.length > 0 && (
              <section>
                <h2 className="text-xl font-heading font-bold text-[#1B4D3E] mb-5">
                  Market Insights
                </h2>
                <div className="bg-[#f4f3f2] rounded-2xl p-6">
                  <p className="text-sm font-bold text-[#404945] mb-4">Price History</p>
                  <PriceHistory history={priceHistoryFormatted} />
                </div>
              </section>
            )}

            {/* EPC — Energy Performance */}
            {property.epcRating && (
              <section>
                <h2 className="text-xl font-heading font-bold text-[#1B4D3E] mb-5">
                  Energy Performance
                </h2>
                <div className="bg-[#f4f3f2] rounded-2xl p-6 space-y-6">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-[#404945] uppercase tracking-wider">
                        Current Rating
                      </span>
                      <div className="text-3xl font-heading font-extrabold text-[#1B4D3E]">
                        {property.epcScore != null ? `${property.epcScore} | ` : ""}{epc}
                      </div>
                    </div>
                  </div>

                  {/* EPC Scale */}
                  <div className="flex h-10 rounded-lg overflow-hidden gap-0.5">
                    {EPC_BANDS.map((band) => (
                      <div
                        key={band}
                        className={`flex flex-1 items-center justify-center text-white text-xs font-bold ${EPC_COLORS[band]} ${band === epc ? "ring-4 ring-[#1B4D3E] ring-offset-1 z-10 rounded-sm" : ""}`}
                      >
                        {band}
                      </div>
                    ))}
                  </div>

                  <a
                    href={`https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode?postcode=${encodeURIComponent(property.postcode)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#1B4D3E] hover:underline font-medium"
                  >
                    View full EPC certificate
                  </a>

                  {listing.listingType === "rent" && epc !== "N/A" && ["D", "E", "F", "G"].includes(epc) && (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-800">
                      <strong>MEES Notice:</strong> Rental properties may require a minimum EPC rating of C under upcoming regulations. This property holds a rating of {epc}.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Environmental & Utility Insights */}
            <section>
              <h2 className="text-xl font-heading font-bold text-[#1B4D3E] mb-5">
                Environmental &amp; Connectivity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-white shadow-sm flex gap-4 items-center">
                  <Wifi className="size-7 text-[#1B4D3E] shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#404945] tracking-wider">Broadband</p>
                    <p className="text-sm font-bold text-[#1a1c1c] mt-0.5">Check availability</p>
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-white shadow-sm flex gap-4 items-center">
                  <TrendingUp className="size-7 text-[#1B4D3E] shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#404945] tracking-wider">Flood Risk</p>
                    <p className="text-sm font-bold text-[#1a1c1c] mt-0.5">View report</p>
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-white shadow-sm flex gap-4 items-center">
                  <Car className="size-7 text-[#D4A853] shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#404945] tracking-wider">Transport</p>
                    <p className="text-sm font-bold text-[#1a1c1c] mt-0.5">View connections</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── LOCAL AREA INTELLIGENCE (Wave 6) ── */}
            {isFeatureEnabled("local_area_intelligence") && (
              <section>
                <h2 className="text-xl font-heading font-bold text-[#1B4D3E] mb-5">
                  Local Area Intelligence
                </h2>
                <Suspense
                  fallback={
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className="h-48 bg-[#f4f3f2] rounded-2xl animate-pulse" />
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
              <section id="roi-section">
                <h2 className="text-xl font-heading font-bold text-[#1B4D3E] mb-5">
                  Renovation ROI
                </h2>
                <div className="space-y-5">
                  <Suspense
                    fallback={
                      <div className="rounded-2xl bg-[#f4f3f2] p-6 animate-pulse">
                        <div className="h-5 w-48 bg-[#e3e2e1] rounded mb-4" />
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="h-28 bg-[#e3e2e1] rounded-xl" />
                          ))}
                        </div>
                      </div>
                    }
                  >
                    <RenovationROIPanel property={property as unknown as import("@/types/property").Property} supabase={supabase} />
                  </Suspense>

                  {floorPlanUrl && (
                    <WhatIfFloorPlan
                      floorPlanUrl={floorPlanUrl}
                      selectedRenovationType={null}
                    />
                  )}
                </div>
              </section>
            )}

            {/* ── ASK AGENT FORM ── */}
            <section id={`ask-agent-${property.id}`}>
              <h2 className="text-xl font-heading font-bold text-[#1B4D3E] mb-5">Contact Agent</h2>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <AskAgentForm
                  propertyId={property.id}
                  agentId={agentId}
                  agentName={agentName}
                />
              </div>
            </section>

            {/* ── SIMILAR PROPERTIES ── */}
            <Suspense
              fallback={
                <div className="space-y-3">
                  <div className="h-4 w-40 bg-[#f4f3f2] rounded animate-pulse" />
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 bg-[#f4f3f2] rounded-xl animate-pulse" />
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
            {/* Agent card */}
            <Suspense
              fallback={
                <div className="rounded-2xl bg-white p-5 animate-pulse space-y-3 shadow-sm">
                  <div className="flex gap-3">
                    <div className="size-12 rounded-full bg-[#f4f3f2] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-[#f4f3f2] rounded" />
                      <div className="h-3 w-24 bg-[#f4f3f2] rounded" />
                    </div>
                  </div>
                  <div className="h-10 bg-[#f4f3f2] rounded-xl" />
                </div>
              }
            >
              <AgentCardSidebar agentId={agentId} propertyId={property.id} />
            </Suspense>

            {/* Apply to Rent */}
            {listing.listingType === "rent" && listing.status === "active" && (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[#1a1c1c] mb-2">Interested in renting?</h3>
                <p className="text-xs text-[#404945] mb-4 leading-relaxed">
                  Submit a rental application to the landlord directly.
                </p>
                <Link
                  href={currentUserId
                    ? `/dashboard/renter/applications/apply/${property.id}`
                    : `/login?redirectTo=${encodeURIComponent(`/dashboard/renter/applications/apply/${property.id}`)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4D3E] text-white text-sm font-bold h-11 px-4 transition-colors hover:bg-[#003629]"
                >
                  <FileText className="size-4" />
                  Apply to Rent
                </Link>
              </div>
            )}

            {/* Book Viewing */}
            {canBookViewing && (
              <div id="book-viewing" className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <BookViewingModal
                  propertyId={property.id}
                  propertyStatus={listing.status}
                  existingViewingId={existingViewingId}
                />
              </div>
            )}

            {/* Financial Overview */}
            <div className="rounded-2xl bg-[#f4f3f2] p-5 space-y-5">
              <h3 className="text-sm font-heading font-bold text-[#1B4D3E]">Financial Overview</h3>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <MortgageCalculator initialPrice={listing.price} />
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <SdltCalculator initialPrice={listing.price} />
              </div>
            </div>

            {/* Recommended Tradespeople */}
            <Suspense fallback={null}>
              <RecommendedTradespeople postcode={property.postcode} />
            </Suspense>
          </aside>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-4 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div>
          <p className="font-heading font-bold text-lg text-[#1B4D3E]">{priceFormatted}</p>
          <p className="text-xs text-[#404945]">
            {property.bedrooms} bed · {propertyTypeLabel}
          </p>
        </div>
        {canBookViewing && (
          <a
            href="#book-viewing"
            className="shrink-0 bg-[#1B4D3E] text-white font-bold text-sm rounded-xl h-10 px-5 flex items-center gap-2 transition-colors hover:bg-[#003629]"
          >
            <CalendarIcon className="size-4" />
            Book Viewing
          </a>
        )}
      </div>
    </div>
  );
}

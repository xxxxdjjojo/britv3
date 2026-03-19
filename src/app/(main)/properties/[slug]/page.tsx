import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

function extractFeatureItems(features: Record<string, unknown>): string[] {
  const items = features["items"];
  if (Array.isArray(items)) {
    return items.filter((x): x is string => typeof x === "string");
  }
  // Some entries store features as top-level string values keyed by name
  return Object.entries(features)
    .filter(([, v]) => typeof v === "string" || v === true)
    .map(([k]) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .slice(0, 10);
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

  const priceFormatted = `£${listing.price.toLocaleString("en-GB")}`;
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
  const canBookViewing =
    listing.status !== "sold" &&
    (listing.status as string) !== "archived" &&
    (listing.status as string) !== "draft";

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/properties?location=${encodeURIComponent(property.city)}`}
            className="hover:text-foreground transition-colors"
          >
            {property.city}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">
            {address}
          </span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 lg:pb-8">
        {/* Gallery */}
        <Gallery images={images} className="mt-2 mb-6" />

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
        <div className="sticky top-16 z-20 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-b mb-6 lg:static lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:px-0 lg:py-0 lg:mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-primary">{priceFormatted}</p>
              <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-xs">
                {address}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bed className="size-4" />
                  {property.bedrooms} beds
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="size-4" />
                  {property.bathrooms} baths
                </span>
                {sqft > 0 && (
                  <span className="flex items-center gap-1">
                    <Square className="size-4" />
                    {sqft.toLocaleString("en-GB")} sq ft
                  </span>
                )}
              </div>

              {/* Social proof badge — shows live viewer count + saves */}
              <div className="mt-2">
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
              {/* Mobile book button */}
              {canBookViewing && (
                <button
                  className="shrink-0 gap-1.5 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-3 lg:hidden"
                  aria-label="Book viewing (scroll to booking form)"
                  onClick={undefined}
                >
                  <CalendarIcon className="size-4" />
                  Book
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 65/35 grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ── MAIN CONTENT ── */}
          <div className="space-y-10 min-w-0">
            {/* About this property */}
            <section>
              <h2 className="text-xl font-semibold mb-3">
                About this property
              </h2>
              <Separator className="mb-4" />
              <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {property.description}
              </div>
              {features.length > 0 && (
                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className="size-1.5 rounded-full bg-brand-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Property features grid */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Property details</h2>
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl border bg-card p-3"
                  >
                    <span className="text-muted-foreground mt-0.5">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="font-medium text-sm">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Floor Plan */}
            {floors.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-3">Floor plans</h2>
                <Separator className="mb-4" />
                <FloorPlan floors={floors} />
              </section>
            )}

            {/* Location map placeholder */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Location</h2>
              <Separator className="mb-4" />
              <div className="relative h-64 rounded-xl overflow-hidden border bg-neutral-100 flex items-center justify-center">
                <MapPin className="size-10 text-muted-foreground opacity-40" />
                <p className="absolute bottom-3 right-3 text-sm text-muted-foreground">
                  {address}
                </p>
              </div>
            </section>

            {/* Price History */}
            {priceHistoryFormatted.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-3">Price history</h2>
                <Separator className="mb-4" />
                <PriceHistory history={priceHistoryFormatted} />
              </section>
            )}

            {/* EPC display */}
            {property.epcRating && (
              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Energy Performance Certificate
                </h2>
                <Separator className="mb-4" />
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Current EPC Rating</p>
                      <p className="text-xs text-muted-foreground">
                        Energy efficiency: {epc}
                      </p>
                    </div>
                    <Badge className="ml-auto">{epc}</Badge>
                  </div>
                  <div className="flex items-stretch gap-1 h-8">
                    {EPC_BANDS.map((band) => (
                      <div
                        key={band}
                        className={`flex flex-1 items-center justify-center rounded text-xs font-bold text-white ${EPC_COLORS[band]} ${band === epc ? "ring-2 ring-offset-1 ring-foreground scale-110 z-10" : "opacity-70"}`}
                      >
                        {band}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Rating {epc} — Energy efficiency certificate
                  </p>
                </div>
              </section>
            )}

            {/* ── LOCAL AREA INTELLIGENCE (Wave 6) ── */}
            <section>
              <h2 className="text-xl font-semibold mb-3">
                Local Area Intelligence
              </h2>
              <Separator className="mb-4" />
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="h-48 bg-muted rounded-xl animate-pulse" />
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
                  <FloodRiskWidget riskLevel="Low" source="Environment Agency" />
                  <CrimeStatsChart stats={[]} boroughAvg={null} />
                </div>
              </Suspense>
            </section>

            {/* ── ROI SECTION (Wave 4) ── */}
            {listing.listingType === "sale" && (
              <section id="roi-section">
                <h2 className="text-xl font-semibold mb-3">
                  Renovation ROI
                </h2>
                <Separator className="mb-4" />
                <div className="space-y-6">
                  <Suspense
                    fallback={
                      <div className="rounded-xl border bg-card p-6 animate-pulse">
                        <div className="h-5 w-48 bg-muted rounded mb-4" />
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="h-28 bg-muted rounded-xl" />
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
            <section id={`ask-agent-${property.id}`}>
              <h2 className="text-xl font-semibold mb-3">Contact Agent</h2>
              <Separator className="mb-4" />
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
                <div className="rounded-xl border bg-card p-5 animate-pulse space-y-3">
                  <div className="flex gap-3">
                    <div className="size-12 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-10 bg-muted rounded-lg" />
                </div>
              }
            >
              <AgentCardSidebar agentId={agentId} propertyId={property.id} />
            </Suspense>

            {/* Book Viewing (Wave 5) — gated on listing status */}
            {canBookViewing && (
              <BookViewingModal
                propertyId={property.id}
                propertyStatus={listing.status}
                existingViewingId={existingViewingId}
              />
            )}

            {/* Mortgage Calculator (Wave 6) */}
            <div className="rounded-xl border bg-card p-4">
              <MortgageCalculator />
            </div>

            {/* SDLT Calculator (Wave 6) */}
            <div className="rounded-xl border bg-card p-4">
              <SdltCalculator />
            </div>

            {/* Similar Properties in sidebar for desktop visibility */}
            <Suspense fallback={null}>
              <RecommendedTradespeople postcode={property.postcode} />
            </Suspense>
          </aside>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-4 lg:hidden">
        <div>
          <p className="font-bold text-lg text-primary">{priceFormatted}</p>
          <p className="text-xs text-muted-foreground">
            {property.bedrooms} bed · {propertyTypeLabel}
          </p>
        </div>
        {canBookViewing && (
          <a
            href="#roi-section"
            className="shrink-0 gap-1.5 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-3 transition-colors hover:bg-primary/90"
            onClick={undefined}
          >
            <CalendarIcon className="size-4" />
            Book Viewing
          </a>
        )}
      </div>
    </div>
  );
}

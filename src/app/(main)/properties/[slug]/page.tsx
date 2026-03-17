import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Heart,
  Share2,
  Star,
  Phone,
  Mail,
  Zap,
  Home,
  FileText,
  Tag,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Gallery } from "@/components/properties/Gallery";
import { FloorPlan } from "@/components/properties/FloorPlan";
import { PriceHistory } from "@/components/properties/PriceHistory";
import type { PriceHistory as PriceHistoryRow, EpcRating } from "@/types/property";
import { ViewingBooking } from "@/components/properties/ViewingBooking";
import { createClient } from "@/lib/supabase/server";
import { getPropertyBySlug } from "@/services/properties/property-detail-service";

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

  const { property, listing } = detail;
  const bedsLabel = `${property.bedrooms}-bed`;
  const typeLabel = formatPropertyType(property.property_type);
  const cityLabel = property.city;

  return {
    title: `${bedsLabel} ${typeLabel} in ${cityLabel} | Britestate`,
    description: (property.description ?? "").slice(0, 160),
    openGraph: {
      title: `${bedsLabel} ${typeLabel} in ${cityLabel} | Britestate`,
      description: (property.description ?? "").slice(0, 160),
      images: detail.media
        .filter((m) => m.media_type === "image")
        .slice(0, 1)
        .map((m) => ({ url: m.url, alt: m.alt_text ?? "" })),
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
  rows: PriceHistoryRow[],
): { date: string; price: number; event?: string }[] {
  return rows.map((row, i) => ({
    date:
      row.changed_at instanceof Date
        ? row.changed_at.toISOString().slice(0, 10)
        : String(row.changed_at).slice(0, 10),
    price: row.new_price,
    event: i === rows.length - 1 ? "Listed" : row.new_price < row.old_price ? "Reduced" : undefined,
  }));
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

  const { listing, property, media, priceHistory, agentProfile } = detail;

  // Derived display values
  const address = [
    property.address_line1,
    property.address_line2,
    property.city,
    property.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const priceFormatted = `£${listing.price.toLocaleString("en-GB")}`;
  const sqft = property.square_footage ?? 0;
  const propertyTypeLabel = formatPropertyType(property.property_type);
  const tenureLabel = formatTenure(property.tenure ?? null);
  const epc: EpcRating | "N/A" = property.epc_rating ?? "N/A";
  const councilTax = property.council_tax_band
    ? `Band ${property.council_tax_band}`
    : "Unknown";
  const features = extractFeatureItems(property.features);

  const images = media
    .filter((m) => m.media_type === "image")
    .map((m) => ({ src: m.url, alt: m.alt_text ?? "" }));

  const floors = media
    .filter((m) => m.media_type === "floor_plan")
    .map((m) => ({ label: m.caption ?? "Floor Plan", imageUrl: m.url }));

  const priceHistoryFormatted = formatPriceHistory(
    [...priceHistory].reverse(),
  );

  const agent = {
    name: agentProfile?.display_name || "Agent",
    agency: agentProfile?.agency_name || "Britestate",
    phone: agentProfile?.phone || "",
    rating: agentProfile?.rating ?? 0,
    reviews: agentProfile?.review_count ?? 0,
  };

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
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Heart className="size-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Share2 className="size-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button size="sm" className="gap-1.5 lg:hidden">
                <CalendarIcon className="size-4" />
                Book
              </Button>
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
                <p className="absolute bottom-3 right-3">
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <MapPin className="size-4" />
                    View on Map
                  </Button>
                </p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" />
                {address}
              </p>
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
            {property.epc_rating && (
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
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            {/* Agent card */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="size-12 rounded-full bg-neutral-200 flex items-center justify-center text-lg font-bold text-neutral-500 shrink-0">
                  {agent.name
                    .split(" ")
                    .map((n) => n.charAt(0))
                    .filter(Boolean)
                    .join("")}
                </div>
                <div>
                  <p className="font-semibold text-sm">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.agency}</p>
                  {agent.rating > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3 ${i < Math.floor(agent.rating) ? "fill-brand-secondary text-brand-secondary" : "text-muted-foreground"}`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        {agent.rating} ({agent.reviews})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Mail className="size-4" />
                  Contact
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Phone className="size-4" />
                  Call
                </Button>
              </div>

              {agent.phone && (
                <p className="text-xs text-center text-muted-foreground">
                  {agent.phone}
                </p>
              )}
            </div>

            {/* Viewing Booking */}
            <ViewingBooking
              agentName={agent.name}
              propertyAddress={address}
            />
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
        <Button className="shrink-0 gap-1.5">
          <CalendarIcon className="size-4" />
          Book Viewing
        </Button>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
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
import { ViewingBooking } from "@/components/properties/ViewingBooking";

export const metadata: Metadata = {
  title: "4-Bed Victorian Terraced House, Isleworth | Britestate",
  description:
    "A beautifully presented four-bedroom Victorian terraced house in the highly sought-after Isleworth area. South-facing garden, recently refurbished kitchen.",
};

const MOCK_PROPERTY = {
  title: "4-Bed Victorian Terraced House",
  address: "14 Elm Road, Isleworth, Middlesex, TW7 4PQ",
  price: "£425,000",
  beds: 4,
  baths: 2,
  receptions: 2,
  sqft: 1820,
  type: "Terraced",
  tenure: "Freehold",
  councilTax: "Band D",
  epc: "C",
  description:
    "A beautifully presented four-bedroom Victorian terraced house situated in the highly sought-after Isleworth area. The property retains much of its original Victorian character whilst benefitting from a full programme of modernisation carried out by the current owners.\n\nThe ground floor comprises a bright double reception room with period fireplaces, a superb open-plan kitchen/dining room with bi-fold doors opening to the south-facing garden, and a guest cloakroom. The first floor provides four well-proportioned bedrooms and a stylishly appointed family bathroom.\n\nThe property is offered for sale with no onward chain, and benefits from a west-facing rear garden, off-street parking and excellent transport links to central London via Isleworth station.",
  features: [
    "South-facing garden",
    "Recently refurbished kitchen",
    "Victorian fireplaces",
    "Double glazing",
    "Off-street parking",
  ],
  agent: {
    name: "James Fletcher",
    agency: "Britestate Realty",
    phone: "020 7123 4567",
    email: "james.fletcher@britestate.co.uk",
    rating: 4.9,
    reviews: 127,
  },
};

const MOCK_IMAGES = [
  { src: "", alt: "Front exterior" },
  { src: "", alt: "Living room" },
  { src: "", alt: "Kitchen" },
  { src: "", alt: "Master bedroom" },
];

const MOCK_FLOORS = [
  { label: "Ground Floor", imageUrl: "" },
  { label: "First Floor", imageUrl: "" },
];

const MOCK_PRICE_HISTORY = [
  { date: "2025-09-01", price: 380000, event: "Listed" },
  { date: "2025-10-15", price: 370000, event: "Reduced" },
  { date: "2025-11-20", price: 370000 },
  { date: "2025-12-10", price: 395000 },
  { date: "2026-01-20", price: 410000 },
  { date: "2026-02-28", price: 425000, event: "SSTC" },
];

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

export default function PropertyPage() {
  const p = MOCK_PROPERTY;

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
            href="/properties?location=London"
            className="hover:text-foreground transition-colors"
          >
            London
          </Link>
          <span>/</span>
          <Link
            href="/properties?location=Isleworth"
            className="hover:text-foreground transition-colors"
          >
            Isleworth
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">
            {p.address}
          </span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 lg:pb-8">
        {/* Gallery */}
        <Gallery images={MOCK_IMAGES} className="mt-2 mb-6" />

        {/* Sticky info bar */}
        <div className="sticky top-16 z-20 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-b mb-6 lg:static lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:px-0 lg:py-0 lg:mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-primary">{p.price}</p>
              <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-xs">
                {p.address}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bed className="size-4" />
                  {p.beds} beds
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="size-4" />
                  {p.baths} baths
                </span>
                <span className="flex items-center gap-1">
                  <Square className="size-4" />
                  {p.sqft.toLocaleString()} sq ft
                </span>
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
                {p.description}
              </div>
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="size-1.5 rounded-full bg-brand-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
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
                    value: p.type,
                  },
                  {
                    icon: <FileText className="size-4" />,
                    label: "Tenure",
                    value: p.tenure,
                  },
                  {
                    icon: <Tag className="size-4" />,
                    label: "Council Tax",
                    value: p.councilTax,
                  },
                  {
                    icon: <Zap className="size-4" />,
                    label: "EPC Rating",
                    value: p.epc,
                  },
                  {
                    icon: <Bed className="size-4" />,
                    label: "Bedrooms",
                    value: String(p.beds),
                  },
                  {
                    icon: <Bath className="size-4" />,
                    label: "Bathrooms",
                    value: String(p.baths),
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
            <section>
              <h2 className="text-xl font-semibold mb-3">Floor plans</h2>
              <Separator className="mb-4" />
              <FloorPlan floors={MOCK_FLOORS} />
            </section>

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
                {p.address}
              </p>
            </section>

            {/* Price History */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Price history</h2>
              <Separator className="mb-4" />
              <PriceHistory history={MOCK_PRICE_HISTORY} />
            </section>

            {/* EPC display */}
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
                      Energy efficiency: {p.epc}
                    </p>
                  </div>
                  <Badge className="ml-auto">{p.epc}</Badge>
                </div>
                <div className="flex items-stretch gap-1 h-8">
                  {EPC_BANDS.map((band) => (
                    <div
                      key={band}
                      className={`flex flex-1 items-center justify-center rounded text-xs font-bold text-white ${EPC_COLORS[band]} ${band === p.epc ? "ring-2 ring-offset-1 ring-foreground scale-110 z-10" : "opacity-70"}`}
                    >
                      {band}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Rating {p.epc} — Good energy efficiency
                </p>
              </div>
            </section>
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            {/* Agent card */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="size-12 rounded-full bg-neutral-200 flex items-center justify-center text-lg font-bold text-neutral-500 shrink-0">
                  {p.agent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-semibold text-sm">{p.agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.agent.agency}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3 ${i < Math.floor(p.agent.rating) ? "fill-brand-secondary text-brand-secondary" : "text-muted-foreground"}`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">
                      {p.agent.rating} ({p.agent.reviews})
                    </span>
                  </div>
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

              <p className="text-xs text-center text-muted-foreground">
                {p.agent.phone}
              </p>
            </div>

            {/* Viewing Booking */}
            <ViewingBooking
              agentName={p.agent.name}
              propertyAddress="14 Elm Road, Isleworth"
            />
          </aside>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-4 lg:hidden">
        <div>
          <p className="font-bold text-lg text-primary">{p.price}</p>
          <p className="text-xs text-muted-foreground">
            {p.beds} bed · {p.type}
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

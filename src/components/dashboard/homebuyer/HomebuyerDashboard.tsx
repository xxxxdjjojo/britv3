
/**
 * Homebuyer dashboard — Stitch design system restyle.
 * Sections: welcome hero, stats, new-properties carousel, next viewing + activity, recommended services.
 *
 * Color tokens (from globals.css / Stitch design):
 *   bg-brand-primary         → #1B4D3E  (primary-container / welcome banner bg)
 *   bg-brand-primary-dark    → #003629  (primary / active button fill)
 *   bg-secondary-fixed-dim   → #eec068  (golden CTA — CSS var --color-secondary-fixed-dim)
 *   bg-surface               → #faf9f8
 *   bg-surface-container-low → #f4f3f2
 *   bg-surface-container     → #eeedec
 *   text-on-surface          → #1a1c1c
 *   text-on-primary-container→ #8abda9
 *   border-outline-variant   → #c0c9c3
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Bell,
  Calendar,
  Mail,
  MapPin,
  Bed,
  Bath,
  TrendingDown,
  MessageSquare,
  FileText,
  Building,
  Gavel,
  Truck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Navigation,
  RefreshCw,
} from "lucide-react";
import type { HomebuyerDashboard as HomebuyerData } from "@/types/dashboard";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PROPERTIES = [
  {
    id: "p1",
    price: "£485,000",
    name: "Richmond Road",
    location: "Isleworth TW7",
    beds: 3,
    baths: 2,
    sqft: "1,150",
    tag: "New Listing",
    tagVariant: "primary" as const,
  },
  {
    id: "p2",
    price: "£495,000",
    name: "Linkfield Road",
    location: "Isleworth TW7",
    beds: 3,
    baths: 2,
    sqft: "1,210",
    tag: "Reduced",
    tagVariant: "secondary" as const,
  },
  {
    id: "p3",
    price: "£470,000",
    name: "Ambleside Avenue",
    location: "Isleworth TW7",
    beds: 3,
    baths: 1,
    sqft: "1,080",
    tag: null,
    tagVariant: "primary" as const,
  },
];

const MOCK_ACTIVITY = [
  {
    id: 1,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    Icon: TrendingDown,
    title: "Price Reduction",
    description: "Linkfield Road dropped to £495,000",
    time: "2 HOURS AGO",
  },
  {
    id: 2,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    Icon: MessageSquare,
    title: "Viewing Confirmed",
    description: "Your viewing for 22 Oak Lane is confirmed",
    time: "5 HOURS AGO",
  },
  {
    id: 3,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    Icon: FileText,
    title: "New Match",
    description: "Richmond Road added to your matches",
    time: "YESTERDAY",
  },
];

const MOCK_SERVICES = [
  {
    id: "s1",
    Icon: Building,
    title: "Mortgage Broker",
    description:
      "Expert financial advice to secure the best rates for your property purchase.",
    href: "/services/mortgage",
    cta: "Explore Rates",
  },
  {
    id: "s2",
    Icon: Gavel,
    title: "Solicitor",
    description:
      "Streamlined legal processing and conveyancing with fixed-fee protection.",
    href: "/services/legal",
    cta: "Get Quotes",
  },
  {
    id: "s3",
    Icon: Truck,
    title: "Surveyor",
    description:
      "RICS certified surveys to ensure peace of mind for your new investment.",
    href: "/services/moving",
    cta: "Book Survey",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HomebuyerDashboard({
  data,
}: Readonly<{ data: HomebuyerData }>) {
  const userName = "Alexander";

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* ── 1. Welcome Banner ─────────────────────────────────────────── */}
      {/*
        Stitch: bg = primary-container (#1b4d3e) = --color-brand-primary
        Decorative orb stays, sub-text colour = on-primary-container (#8abda9)
        CTA = secondary-fixed-dim (#eec068) via CSS var
      */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-primary p-8 lg:p-10">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white lg:text-3xl">
              Good morning, {userName}!
            </h2>
            <p
              className="text-lg"
              style={{ color: "var(--color-on-primary-container, #8abda9)" }}
            >
              You have 3 new properties matching your searches in Isleworth.
            </p>
          </div>
          <Link href="/dashboard/homebuyer/ai-match">
            <Button
              className="shrink-0 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wide hover:opacity-90"
              style={{
                backgroundColor: "var(--color-secondary-fixed-dim, #eec068)",
                color: "var(--color-on-secondary-fixed-dim, #271900)",
              }}
              aria-label="View AI property matches"
            >
              View Matches
            </Button>
          </Link>
        </div>
        {/* Decorative orb */}
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </section>

      {/* ── 2. Stats Row ──────────────────────────────────────────────── */}
      <section
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Dashboard statistics"
      >
        <StatCard
          Icon={Heart}
          label="Saved Properties"
          value={data.saved_properties_count ?? 12}
        />
        <StatCard
          Icon={Bell}
          label="Active Alerts"
          value={data.active_searches_count ?? 3}
        />
        <StatCard
          Icon={Calendar}
          label="Upcoming Viewings"
          value={data.upcoming_viewings.length || 2}
        />
        <StatCard
          Icon={Mail}
          label="Unread Messages"
          value={5}
        />
      </section>

      {/* ── 3. New Properties Carousel ────────────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
              New Properties for You
            </h3>
            <p className="text-sm text-neutral-500">
              3-bed homes in Isleworth under £500k
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Previous — surface-container */}
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high"
              aria-label="Previous properties"
            >
              <ChevronLeft className="size-5" strokeWidth={1.5} />
            </button>
            {/* Next — brand-primary-dark (primary = #003629) */}
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full bg-brand-primary-dark text-white transition-opacity hover:opacity-90"
              aria-label="Next properties"
            >
              <ChevronRight className="size-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {MOCK_PROPERTIES.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* ── 4. Split: Next Viewing + Recent Activity ──────────────────── */}
      <section className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Left 2/3 — Next Viewing */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="font-heading text-xl font-bold tracking-tight text-on-surface">
            Next Viewing
          </h3>
          {/* bg-surface-container-low = #f4f3f2 */}
          <div className="relative overflow-hidden rounded-3xl bg-surface-container-low p-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-start">
              {/* Property thumbnail placeholder */}
              <div className="aspect-square w-full shrink-0 overflow-hidden rounded-2xl bg-surface-container-high md:w-48">
                <div className="flex size-full items-center justify-center">
                  <MapPin className="size-10 text-neutral-300" strokeWidth={1.25} />
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary">
                      Tomorrow at 10:30 AM
                    </p>
                    <h4 className="font-heading text-2xl font-bold text-on-surface">
                      22 Oak Lane
                    </h4>
                    <p className="text-sm text-neutral-500">
                      Isleworth, London, TW7 4JP
                    </p>
                  </div>
                  {/* Confirmed badge */}
                  <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Confirmed
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl bg-brand-primary-dark px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <Navigation className="size-4" strokeWidth={1.5} />
                    Get Directions
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-outline-variant bg-white px-6 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                  >
                    <RefreshCw className="size-4" strokeWidth={1.5} />
                    Reschedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/3 — Recent Activity */}
        <div className="flex flex-col gap-4">
          <h3 className="font-heading text-xl font-bold tracking-tight text-on-surface">
            Recent Activity
          </h3>
          <div className="flex flex-col gap-6">
            {MOCK_ACTIVITY.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ${item.iconBg}`}
                >
                  <item.Icon className={`size-4 ${item.iconColor}`} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-on-surface">
                    {item.title}
                  </p>
                  <p className="text-xs text-neutral-500">{item.description}</p>
                  <p className="mt-1.5 text-[10px] font-medium text-neutral-400">
                    {item.time}
                  </p>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="w-full pt-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-brand-primary-dark"
            >
              View All Activity
            </button>
          </div>
        </div>
      </section>

      {/* ── 5. Recommended Services ───────────────────────────────────── */}
      <section className="flex flex-col gap-8">
        <h3 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
          Recommended Services
        </h3>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card sub-component
// ---------------------------------------------------------------------------

function StatCard({
  Icon,
  label,
  value,
}: Readonly<{
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string | number;
}>) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-outline-variant/10 bg-white p-6 text-center shadow-sm">
      <Icon className="mb-4 size-6 text-brand-primary" strokeWidth={1.25} />
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
        {label}
      </p>
      <p className="font-heading text-3xl font-extrabold text-on-surface">
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property card sub-component
// ---------------------------------------------------------------------------

type PropertyCardData = {
  id: string;
  price: string;
  name: string;
  location: string;
  beds: number;
  baths: number;
  sqft: string;
  tag: string | null;
  tagVariant: "primary" | "secondary";
};

function PropertyCard({ property }: Readonly<{ property: PropertyCardData }>) {
  // Stitch: "New Listing" = brand-primary bg, white text
  //         "Reduced"     = secondary-container (#fdcd74) bg, dark amber text
  const tagClasses =
    property.tagVariant === "secondary"
      ? "bg-secondary-container text-on-secondary-container"
      : "bg-brand-primary/90 text-white";

  return (
    <div className="group overflow-hidden rounded-3xl border border-outline-variant/10 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image placeholder — 4:5 aspect ratio per Stitch */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-low">
        <div className="flex size-full items-center justify-center">
          <Heart className="size-12 text-neutral-200" strokeWidth={1} />
        </div>

        {property.tag && (
          <div className="absolute left-4 top-4">
            <span
              className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${tagClasses}`}
            >
              {property.tag}
            </span>
          </div>
        )}

        {/* Save button */}
        <button
          type="button"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-white/90 text-neutral-400 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label={`Save ${property.name}`}
        >
          <Heart className="size-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="p-6">
        {/* Price — Stitch: 2xl bold, on-surface (dark) */}
        <p className="font-heading text-2xl font-bold text-on-surface">
          {property.price}
        </p>
        <p className="mb-4 mt-1 text-sm text-neutral-500">
          {property.name}, {property.location}
        </p>
        <div className="flex items-center gap-4 border-t border-outline-variant/20 pt-4 text-sm text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Bed className="size-4" strokeWidth={1.25} />
            {property.beds}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="size-4" strokeWidth={1.25} />
            {property.baths}
          </span>
          <span className="flex items-center gap-1.5">
            <Search className="size-4" strokeWidth={1.25} />
            {property.sqft}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Service card sub-component
// ---------------------------------------------------------------------------

type ServiceData = {
  id: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  href: string;
  cta: string;
};

function ServiceCard({ service }: Readonly<{ service: ServiceData }>) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-outline-variant/10 bg-white p-8 transition-all hover:border-brand-primary/20 hover:shadow-sm">
      {/* Icon container — bg-surface-container-low per Stitch */}
      <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-surface-container-low transition-colors group-hover:bg-brand-primary-lighter">
        <service.Icon className="size-6 text-brand-primary" strokeWidth={1.25} />
      </div>
      <h4 className="font-heading mb-2 text-lg font-bold text-on-surface">
        {service.title}
      </h4>
      <p className="mb-6 text-sm leading-relaxed text-neutral-500">
        {service.description}
      </p>
      <Link
        href={service.href}
        className="flex items-center gap-2 text-sm font-bold text-brand-primary transition-transform hover:translate-x-1"
      >
        {service.cta}
        <ArrowRight className="size-4" strokeWidth={1.5} />
      </Link>
    </div>
  );
}

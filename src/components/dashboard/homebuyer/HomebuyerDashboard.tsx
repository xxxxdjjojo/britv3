
/**
 * Homebuyer dashboard — Stitch-based design.
 * Shows welcome banner, stats, new properties carousel, next viewing,
 * recent activity timeline, and recommended services.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardWelcome } from "@/components/dashboard/shared/DashboardWelcome";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import {
  Heart,
  Calendar,
  MapPin,
  Bed,
  Bath,
  Square,
  TrendingDown,
  MessageSquare,
  FileText,
  Building,
  Gavel,
  Truck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Phone,
  Search,
} from "lucide-react";
import type { HomebuyerDashboard as HomebuyerData } from "@/types/dashboard";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PROPERTIES = [
  {
    id: "p1",
    price: "£1,250,000",
    name: "The Glass House Residency",
    location: "Kensington Garden, London",
    beds: 3,
    baths: 2,
    sqft: "1,200",
    tags: ["Featured", "Virtual Tour"],
  },
  {
    id: "p2",
    price: "£875,000",
    name: "Greenwich Penthouse Suite",
    location: "Riverside Drive, Greenwich",
    beds: 2,
    baths: 2,
    sqft: "950",
    tags: [],
  },
  {
    id: "p3",
    price: "£4,200/mo",
    name: "Victorian Townhouse",
    location: "Chelsea Mews, London",
    beds: 4,
    baths: 3,
    sqft: "2,100",
    tags: [],
  },
  {
    id: "p4",
    price: "£1,100,000",
    name: "The Marble Loft",
    location: "Shoreditch High St, London",
    beds: 1,
    baths: 1,
    sqft: "850",
    tags: [],
  },
];

const MOCK_ACTIVITY = [
  {
    id: 1,
    icon: TrendingDown,
    iconColor: "text-success",
    title: "Price dropped on a saved home",
    description:
      "Victorian Townhouse Chelsea decreased from £4,500 to £4,200/mo",
    time: "2 hours ago",
  },
  {
    id: 2,
    icon: MessageSquare,
    iconColor: "text-brand-primary",
    title: "New message from Sarah Jones",
    description: "Viewing confirmed for tomorrow",
    time: "5 hours ago",
  },
  {
    id: 3,
    icon: FileText,
    iconColor: "text-neutral-500",
    title: "Offer document received",
    description: "Draft offer for Greenwich Penthouse ready",
    time: "Yesterday",
  },
];

const MOCK_SERVICES = [
  {
    id: "s1",
    icon: Building,
    title: "Mortgage Pre-approval",
    description:
      "Get pre-approved to strengthen your offer and speed up the buying process.",
    href: "/mortgage-brokers",
  },
  {
    id: "s2",
    icon: Gavel,
    title: "Legal Advice",
    description:
      "Connect with qualified solicitors for conveyancing and property law guidance.",
    href: "/conveyancers",
  },
  {
    id: "s3",
    icon: Truck,
    title: "Moving Concierge",
    description:
      "Stress-free moving with vetted removal companies and change-of-address services.",
    href: "/post-a-job",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function HomebuyerDashboard({ data }: Readonly<{ data: HomebuyerData }>) {
  const userName = "James";

  return (
    <div className="flex flex-col gap-8">
      {/* ── 1. Welcome Banner ─────────────────────────────────────────── */}
      <DashboardWelcome
        name={userName}
        variant="hero"
        message="You have 5 new property matches since your last visit. Let's find your dream home."
        actions={[
          { label: "Resume Search", href: "/search", icon: Search },
          {
            label: "Review Favourites",
            href: "/dashboard/homebuyer/saved",
            variant: "outline",
            icon: Heart,
          },
        ]}
      />

      {/* ── 2. New Properties Carousel ────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
            New Properties For You
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon-sm" aria-label="Previous">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Next">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_PROPERTIES.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              {/* Image placeholder */}
              <div className="relative aspect-[4/3] bg-muted">
                {property.tags.length > 0 && (
                  <div className="absolute left-2 top-2 flex gap-1.5">
                    {property.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/80 transition hover:bg-white"
                  aria-label="Save property"
                >
                  <Heart className="size-4 text-neutral-500" />
                </button>
              </div>
              <CardContent className="space-y-2 p-4">
                <p className="text-lg font-bold text-neutral-900">
                  {property.price}
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  {property.name}
                </p>
                <p className="flex items-center gap-1 text-xs text-neutral-500">
                  <MapPin className="size-3" />
                  {property.location}
                </p>
                <div className="flex items-center gap-3 border-t border-neutral-200 pt-2 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Bed className="size-3" />
                    {property.beds}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="size-3" />
                    {property.baths}
                  </span>
                  <span className="flex items-center gap-1">
                    <Square className="size-3" />
                    {property.sqft} sq ft
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 3. Split: Next Viewing + Recent Activity ──────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — Next Viewing (1/3) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4 text-brand-primary" />
              Next Viewing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Map placeholder */}
            <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
              <MapPin className="size-8 text-neutral-500" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-neutral-900">
                The Glass House Residency
              </p>
              <p className="text-xs text-neutral-500">
                Unit 402, Kensington Garden
              </p>
              <p className="text-xs font-medium text-brand-primary">
                Tomorrow at 10:30 AM
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-semibold text-neutral-900">
                  SJ
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  Sarah Jones
                </p>
                <p className="text-xs text-neutral-500">Senior Agent</p>
              </div>
              <Button variant="outline" size="icon-sm" aria-label="Call agent">
                <Phone className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right — Recent Activity (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/notifications" />}>
              View all
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-neutral-200">
              {MOCK_ACTIVITY.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-50">
                    <item.icon className={`size-5 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium text-neutral-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {item.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Recommended Services ───────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Recommended Services" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {MOCK_SERVICES.map((service) => (
            <Card key={service.id} className="transition hover:shadow-md">
              <CardContent className="flex flex-col items-start gap-3 p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-neutral-50">
                  <service.icon className="size-5 text-brand-primary" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  {service.title}
                </h3>
                <p className="text-xs leading-relaxed text-neutral-500">
                  {service.description}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-auto px-0 text-brand-primary"
                  render={<Link href={service.href} />}
                >
                  Learn more
                  <ArrowRight className="ml-1 size-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

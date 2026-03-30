
/**
 * Homebuyer dashboard — Invisible Estate design system.
 * Sections: welcome hero, stats, new-properties carousel, next viewing + activity, recommended services.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardWelcome } from "@/components/dashboard/shared/DashboardWelcome";
import {
  Heart,
  Bell,
  Calendar,
  Mail,
  MapPin,
  Bed,
  Bath,
  SquareIcon,
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
  Sparkles,
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
    matchScore: 98,
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
    matchScore: 91,
  },
  {
    id: "p3",
    price: "£4,200/mo",
    name: "Victorian Townhouse",
    location: "Chelsea Mews, London",
    beds: 4,
    baths: 3,
    sqft: "2,100",
    tags: ["Price Drop"],
    matchScore: 87,
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
    matchScore: 82,
  },
];

const MOCK_ACTIVITY = [
  {
    id: 1,
    icon: TrendingDown,
    iconBg: "bg-success-light",
    iconColor: "text-success",
    title: "Price dropped on a saved home",
    description:
      "Victorian Townhouse Chelsea decreased from £4,500 to £4,200/mo",
    time: "2 hours ago",
  },
  {
    id: 2,
    icon: MessageSquare,
    iconBg: "bg-brand-primary-lighter",
    iconColor: "text-brand-primary",
    title: "New message from Sarah Jones",
    description: "Viewing confirmed for tomorrow at 10:30 AM",
    time: "5 hours ago",
  },
  {
    id: 3,
    icon: FileText,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-500",
    title: "Offer document received",
    description: "Draft offer for Greenwich Penthouse ready to review",
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
    href: "/services/mortgage",
  },
  {
    id: "s2",
    icon: Gavel,
    title: "Legal Advice",
    description:
      "Connect with qualified solicitors for conveyancing and property law guidance.",
    href: "/services/legal",
  },
  {
    id: "s3",
    icon: Truck,
    title: "Moving Concierge",
    description:
      "Stress-free moving with vetted removal companies and change-of-address services.",
    href: "/services/moving",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HomebuyerDashboard({
  data,
}: Readonly<{ data: HomebuyerData }>) {
  const userName = "James";

  return (
    <div className="flex flex-col gap-8">
      {/* ── 1. Welcome Hero ───────────────────────────────────────────── */}
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

      {/* ── 2. Stats Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashStatCard
          icon={<Heart className="size-5 text-brand-primary" strokeWidth={1.25} />}
          label="Saved Properties"
          value={data.saved_properties_count ?? 12}
          sub="+2 this week"
        />
        <DashStatCard
          icon={<Bell className="size-5 text-brand-primary" strokeWidth={1.25} />}
          label="Active Alerts"
          value={data.active_searches_count ?? 4}
        />
        <DashStatCard
          icon={<Calendar className="size-5 text-brand-primary" strokeWidth={1.25} />}
          label="Viewings Scheduled"
          value={data.upcoming_viewings.length || 3}
          sub="Next: Tomorrow"
        />
        <DashStatCard
          icon={<Mail className="size-5 text-brand-primary" strokeWidth={1.25} />}
          label="Agent Messages"
          value={15}
          sub="8 unread"
        />
      </div>

      {/* ── 3. New Properties Carousel ────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand-secondary" strokeWidth={1.25} />
            <h2 className="font-heading text-lg font-semibold tracking-tight text-neutral-900">
              New Properties For You
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="size-8 rounded-lg p-0"
              aria-label="Previous properties"
            >
              <ChevronLeft className="size-4" strokeWidth={1.25} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="size-8 rounded-lg p-0"
              aria-label="Next properties"
            >
              <ChevronRight className="size-4" strokeWidth={1.25} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_PROPERTIES.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* ── 4. Split: Next Viewing + Recent Activity ──────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — Next Viewing (1/3) */}
        <Card className="overflow-hidden rounded-2xl shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-heading text-sm font-semibold text-neutral-700">
              <Calendar className="size-4 text-brand-primary" strokeWidth={1.25} />
              Next Viewing
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Map placeholder */}
            <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-neutral-100">
              <MapPin className="size-8 text-neutral-300" strokeWidth={1.25} />
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-heading text-sm font-semibold text-neutral-900">
                The Glass House Residency
              </p>
              <p className="text-xs text-neutral-500">
                Unit 402, Kensington Garden
              </p>
              <p className="text-xs font-semibold text-brand-primary">
                Tomorrow at 10:30 AM
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary-lighter">
                <span className="font-heading text-xs font-bold text-brand-primary">
                  SJ
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900">
                  Sarah Jones
                </p>
                <p className="text-xs text-neutral-500">Senior Agent</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="size-8 shrink-0 rounded-lg p-0"
                aria-label="Call Sarah Jones"
              >
                <Phone className="size-3.5" strokeWidth={1.25} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right — Recent Activity (2/3) */}
        <Card className="overflow-hidden rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-heading text-sm font-semibold text-neutral-700">
              Recent Activity
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs text-brand-primary hover:text-brand-primary"
              render={<Link href="/dashboard/homebuyer/activity" />}
            >
              View all
              <ArrowRight className="size-3" strokeWidth={1.25} />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col">
              {MOCK_ACTIVITY.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex gap-4 py-4 ${idx !== 0 ? "border-t border-neutral-100" : ""}`}
                >
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
                  >
                    <item.icon
                      className={`size-4 ${item.iconColor}`}
                      strokeWidth={1.25}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm font-medium text-neutral-900">
                      {item.title}
                    </p>
                    <p className="text-xs leading-relaxed text-neutral-500">
                      {item.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 5. Recommended Services ───────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-neutral-900">
          Recommended Services
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {MOCK_SERVICES.map((service) => (
            <Card
              key={service.id}
              className="group overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary-lighter">
                  <service.icon
                    className="size-5 text-brand-primary"
                    strokeWidth={1.25}
                  />
                </div>
                <h3 className="font-heading text-sm font-semibold text-neutral-900">
                  {service.title}
                </h3>
                <p className="text-xs leading-relaxed text-neutral-500">
                  {service.description}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-auto h-auto gap-1 px-0 text-xs text-brand-primary hover:bg-transparent hover:text-brand-primary-light"
                  render={<Link href={service.href} />}
                >
                  Learn more
                  <ArrowRight className="size-3" strokeWidth={1.25} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card sub-component
// ---------------------------------------------------------------------------

function DashStatCard({
  icon,
  label,
  value,
  sub,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}>) {
  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary-lighter">
          {icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-medium text-neutral-500">{label}</p>
          <p className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            {value}
          </p>
          {sub && <p className="text-xs text-neutral-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
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
  tags: string[];
  matchScore: number;
};

function PropertyCard({ property }: Readonly<{ property: PropertyCardData }>) {
  return (
    <Card className="group overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md">
      {/* Image placeholder */}
      <div className="relative aspect-[4/3] bg-neutral-100">
        {/* Tags */}
        {property.tags.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {property.tags.map((tag) => (
              <Badge
                key={tag}
                className={
                  tag === "Price Drop"
                    ? "bg-success text-white text-xs font-medium"
                    : "bg-white/90 text-neutral-700 text-xs font-medium backdrop-blur-sm"
                }
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {/* AI match score */}
        <div className="absolute right-3 top-3">
          <Badge className="bg-brand-primary text-white text-xs font-semibold">
            {property.matchScore}% match
          </Badge>
        </div>
        {/* Save button */}
        <button
          type="button"
          className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label={`Save ${property.name}`}
        >
          <Heart className="size-4 text-neutral-400" strokeWidth={1.25} />
        </button>
      </div>

      <CardContent className="flex flex-col gap-2 p-4">
        <p className="font-heading text-base font-bold text-neutral-900">
          {property.price}
        </p>
        <p className="text-sm font-medium text-neutral-800 line-clamp-1">
          {property.name}
        </p>
        <p className="flex items-center gap-1 text-xs text-neutral-500">
          <MapPin className="size-3 shrink-0" strokeWidth={1.25} />
          <span className="truncate">{property.location}</span>
        </p>
        <div className="flex items-center gap-3 border-t border-neutral-100 pt-2 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Bed className="size-3" strokeWidth={1.25} />
            {property.beds}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-3" strokeWidth={1.25} />
            {property.baths}
          </span>
          <span className="flex items-center gap-1">
            <SquareIcon className="size-3" strokeWidth={1.25} />
            {property.sqft} sq ft
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

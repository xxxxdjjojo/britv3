"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldCheck, Star, MapPin } from "lucide-react";
import type { ServiceProviderPublicProfile } from "@/types/providers";
import { trackEvent } from "@/lib/analytics/track-event";

const CATEGORY_LABELS: Record<string, string> = {
  plumber: "Plumber",
  electrician: "Electrician",
  builder: "Builder",
  handyman: "Handyman",
  plasterer: "Plasterer",
  painter: "Painter & Decorator",
  carpenter: "Carpenter",
  cleaning: "Cleaning",
  landscaping: "Landscaping",
  interior_design: "Interior Designer",
  architect: "Architect",
  conveyancing: "Conveyancer",
  surveying: "Surveyor",
  mortgage_broker: "Mortgage Broker",
  pest_control: "Pest Control",
  locksmith: "Locksmith",
  property_management: "Property Manager",
  home_inspector: "Home Inspector",
  moving_company: "Removal Company",
  other: "Other",
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TopRatedCarousel({
  providers,
}: Readonly<{ providers: ServiceProviderPublicProfile[] }>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (providers.length === 0) return null;

  function scroll(direction: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
    trackEvent("services_carousel_scroll");
  }

  return (
    <section className="bg-brand-primary py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              Meet Our Top-Rated Pros
            </h2>
            <p className="mt-3 text-lg text-white/60">
              Selected for excellence, verified for peace of mind.
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scroll("left")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scroll("right")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {providers.map((provider) => {
            const firstCategory = provider.services[0] ?? "other";
            const categoryLabel = CATEGORY_LABELS[firstCategory] ?? "Other";
            const rating = provider.provider_rating_stats?.avg_rating;
            const totalReviews = provider.provider_rating_stats?.total_reviews ?? 0;
            const isVerified =
              provider.profiles.provider_verification_status === "verified";
            const initials = getInitials(
              provider.profiles.full_name ?? provider.business_name,
            );

            return (
              <div
                key={provider.id}
                className="w-80 flex-none rounded-2xl bg-white shadow-2xl transition-transform duration-300 hover:-translate-y-2"
                style={{ scrollSnapAlign: "start" }}
              >
                {/* Top area */}
                <div className="relative h-48 overflow-hidden rounded-t-2xl bg-gradient-to-br from-brand-primary/80 to-brand-primary">
                  {provider.profiles.avatar_url ? (
                    <Image
                      src={provider.profiles.avatar_url}
                      alt={provider.business_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-5xl font-bold text-white/40">
                        {initials}
                      </span>
                    </div>
                  )}

                  {/* Verified badge */}
                  {isVerified && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-brand-secondary px-2.5 py-1 text-xs font-semibold text-white">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-gray-900">
                    {provider.business_name}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">{categoryLabel}</p>

                  {/* Rating */}
                  {rating != null && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-secondary/10 px-3 py-1">
                      <Star className="h-4 w-4 fill-brand-secondary text-brand-secondary" />
                      <span className="text-sm font-semibold text-gray-900">
                        {rating}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({totalReviews})
                      </span>
                    </div>
                  )}

                  {/* City */}
                  {provider.city && (
                    <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{provider.city}</span>
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href={`/services/${firstCategory}/${provider.slug}`}
                    onClick={() =>
                      trackEvent("services_get_quote_click", {
                        slug: provider.slug,
                      })
                    }
                    className="mt-4 block w-full rounded-xl bg-brand-primary py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
                  >
                    Get Quote
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

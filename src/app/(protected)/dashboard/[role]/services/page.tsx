"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star, Briefcase, Clock, Building2 } from "lucide-react";
import type { ProviderResult } from "@/app/api/services/route";

type ServiceCategory = "mortgage_broker" | "conveyancing" | "surveying";

const TABS: { label: string; category: ServiceCategory }[] = [
  { label: "Mortgage Brokers", category: "mortgage_broker" },
  { label: "Conveyancers", category: "conveyancing" },
  { label: "Surveyors", category: "surveying" },
];

async function fetchProviders(
  category: ServiceCategory,
  postcode: string,
): Promise<ProviderResult[]> {
  const params = new URLSearchParams({ category, postcode });
  const res = await fetch(`/api/services?${params.toString()}`);
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? "Failed to fetch providers");
  }
  const data = (await res.json()) as { providers: ProviderResult[] };
  return data.providers;
}

function formatServiceLabel(service: string): string {
  return service
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function ProviderCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-5 space-y-3">
        <div className="h-5 w-2/3 rounded bg-neutral-200" />
        <div className="h-4 w-1/3 rounded bg-neutral-200" />
        <div className="h-4 w-1/2 rounded bg-neutral-200" />
        <div className="h-4 w-2/5 rounded bg-neutral-200" />
        <div className="mt-4 h-9 w-full rounded bg-neutral-200" />
      </CardContent>
    </Card>
  );
}

function ProviderCard({ provider }: Readonly<{ provider: ProviderResult }>) {
  const hasReviews =
    provider.total_reviews !== null && provider.total_reviews > 0;

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col p-5 space-y-3">
        {/* Business name */}
        <div>
          <h3 className="font-bold text-neutral-900 leading-tight">
            {provider.business_name ?? provider.display_name ?? "Unknown Provider"}
          </h3>
        </div>

        {/* Service badges */}
        {provider.services && provider.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {provider.services.map((service) => (
              <Badge key={service} variant="secondary" className="text-xs">
                {formatServiceLabel(service)}
              </Badge>
            ))}
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1.5 text-sm">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          {hasReviews ? (
            <span className="text-neutral-700">
              <span className="font-semibold">
                {provider.average_rating?.toFixed(1)}
              </span>
              <span className="text-neutral-500">
                {" "}
                ({provider.total_reviews}{" "}
                {provider.total_reviews === 1 ? "review" : "reviews"})
              </span>
            </span>
          ) : (
            <span className="text-neutral-500">No reviews yet</span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-neutral-600">
          {provider.completed_jobs_count !== null && (
            <span className="flex items-center gap-1">
              <Briefcase className="size-3.5 shrink-0 text-neutral-400" />
              {provider.completed_jobs_count} jobs completed
            </span>
          )}
          {provider.years_in_business !== null && (
            <span className="flex items-center gap-1">
              <Building2 className="size-3.5 shrink-0 text-neutral-400" />
              {provider.years_in_business}{" "}
              {provider.years_in_business === 1 ? "year" : "years"} experience
            </span>
          )}
          {provider.response_time_hours !== null && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5 shrink-0 text-neutral-400" />
              Responds in ~{provider.response_time_hours}h
            </span>
          )}
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* CTA */}
        <div title="Booking and quote flow coming in a future release">
          <Button
            variant="default"
            className="w-full"
            disabled
            aria-disabled="true"
          >
            Get Quote
            <span className="ml-1.5 text-xs font-normal opacity-70">
              (coming soon)
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ServiceDirectoryPage() {
  const [postcode, setPostcode] = useState("");
  const [activeTab, setActiveTab] = useState<ServiceCategory>("mortgage_broker");

  const postcodeReady = postcode.trim().length >= 3;

  const { data: providers, isLoading, isError, error } = useQuery<
    ProviderResult[],
    Error
  >({
    queryKey: ["services", activeTab, postcode.trim()],
    queryFn: () => fetchProviders(activeTab, postcode.trim()),
    enabled: postcodeReady,
    staleTime: 3_600_000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Find Local Professionals
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Discover trusted mortgage brokers, conveyancers, and surveyors near
          you.
        </p>
      </div>

      {/* Postcode input */}
      <div className="flex max-w-sm items-center gap-2">
        <MapPin className="size-4 shrink-0 text-neutral-400" />
        <Input
          type="text"
          placeholder="Enter your postcode (e.g. SW1A 1AA)"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          className="uppercase placeholder:normal-case"
          maxLength={8}
          aria-label="Postcode"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex gap-6" aria-label="Service categories">
          {TABS.map((tab) => (
            <button
              key={tab.category}
              onClick={() => setActiveTab(tab.category)}
              className={[
                "whitespace-nowrap pb-3 text-sm font-medium transition-colors",
                activeTab === tab.category
                  ? "border-b-2 border-brand-accent text-brand-accent"
                  : "border-b-2 border-transparent text-neutral-500 hover:text-neutral-700",
              ].join(" ")}
              aria-current={activeTab === tab.category ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {!postcodeReady ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-16 text-center">
          <MapPin className="size-10 text-neutral-300" />
          <p className="mt-4 text-base font-medium text-neutral-600">
            Enter your postcode to find local professionals
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            We&apos;ll show you verified professionals in your area.
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProviderCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">
            {error?.message ?? "Something went wrong. Please try again."}
          </p>
        </div>
      ) : providers && providers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderCard key={provider.user_id} provider={provider} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-16 text-center">
          <Building2 className="size-10 text-neutral-300" />
          <p className="mt-4 text-base font-medium text-neutral-600">
            No providers found in this area
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Try a nearby postcode to find local professionals.
          </p>
        </div>
      )}
    </div>
  );
}

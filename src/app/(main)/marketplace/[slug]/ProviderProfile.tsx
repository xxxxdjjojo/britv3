"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, MapPin, Clock, CheckCircle2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/RatingStars";
import { RatingDistribution } from "@/components/reviews/RatingDistribution";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ProfileTabs } from "@/components/profiles/ProfileTabs";
import type {
  ServiceCategory,
  Review,
  ProviderRatingStats,
} from "@/types/marketplace";
import { CATEGORY_LABELS } from "@/lib/marketplace/category-labels";
import { sanitizeUrl } from "@/lib/validation/sanitize-text";
import { tradespersonProfilePath } from "@/lib/providers/profile-path";

type ProviderData = {
  user_id: string;
  business_name: string;
  business_description: string | null;
  slug: string;
  services: ServiceCategory[];
  service_postcodes: string[];
  service_radius: number;
  pricing: Record<string, unknown>;
  qualifications: string[] | null;
  accreditations: string[] | null;
  website_url: string | null;
  years_in_business: number;
  completed_jobs_count: number;
  response_time_hours: number | null;
  rating_stats: ProviderRatingStats | null;
};

type ProviderProfileProps = Readonly<{
  provider: ProviderData;
}>;

export function ProviderProfile({ provider }: ProviderProfileProps) {
  const stats = provider.rating_stats;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewSort, setReviewSort] = useState<"recent" | "helpful">("recent");

  const fetchReviews = useCallback(
    async (page: number, sort: "recent" | "helpful") => {
      try {
        const qs = new URLSearchParams({
          page: String(page),
          sort,
          limit: "10",
        });
        const res = await fetch(
          `/api/providers/${provider.slug}/reviews?${qs.toString()}`,
        );
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews ?? []);
          setReviewTotal(data.total ?? 0);
        }
      } catch {
        // silently fail
      }
    },
    [provider.slug],
  );

  useEffect(() => {
    let active = true;
    async function load() {
      await fetchReviews(reviewPage, reviewSort);
      if (!active) return;
    }
    load();
    return () => { active = false; };
  }, [reviewPage, reviewSort, fetchReviews]);

  const handlePageChange = (page: number) => {
    setReviewPage(page);
  };

  const handleSortChange = (sort: "recent" | "helpful") => {
    setReviewSort(sort);
    setReviewPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {provider.business_name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {stats && (
              <div className="flex items-center gap-1.5">
                <RatingStars rating={stats.average_rating} size="sm" showValue />
                <span>({stats.total_reviews} reviews)</span>
              </div>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {provider.years_in_business} years
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5" />
              {provider.completed_jobs_count} jobs completed
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {provider.services.map((svc) => (
              <Badge key={svc} variant="secondary">
                {CATEGORY_LABELS[svc]}
              </Badge>
            ))}
          </div>
        </div>
        <Link
          href={tradespersonProfilePath(provider.slug, { intent: "quote", source: "marketplace_profile" })}
          className="shrink-0"
        >
          <Button size="lg">Request Quote</Button>
        </Link>
      </div>

      {/* Tabbed content */}
      <ProfileTabs
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="space-y-8">
                {/* About */}
                {provider.business_description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {provider.business_description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Details grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Coverage */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Coverage Area</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-4 text-muted-foreground" />
                        <span>{provider.service_radius} mile radius</span>
                      </div>
                      {provider.service_postcodes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {provider.service_postcodes.map((pc) => (
                            <Badge key={pc} variant="outline" className="text-xs">
                              {pc}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Qualifications */}
                  {(provider.qualifications?.length || provider.accreditations?.length) ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Qualifications</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {provider.qualifications?.map((q) => (
                          <div key={q} className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-success" />
                            <span>{q}</span>
                          </div>
                        ))}
                        {provider.accreditations?.map((a) => (
                          <div key={a} className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-brand-primary" />
                            <span>{a}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : null}

                  {/* Website / Contact */}
                  {(() => {
                    const safeUrl = sanitizeUrl(provider.website_url);
                    if (!safeUrl) return null;
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle>Website</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:underline"
                          >
                            <Globe className="size-3.5" />
                            {safeUrl.replace(/^https?:\/\//, "")}
                            <ExternalLink className="size-3" />
                          </a>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>

                {/* Rating Distribution */}
                {stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Rating Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-4xl font-bold text-foreground">
                          {stats.average_rating.toFixed(1)}
                        </span>
                        <RatingStars rating={stats.average_rating} size="lg" />
                        <span className="text-sm text-muted-foreground">
                          {stats.total_reviews} reviews
                        </span>
                      </div>
                      <RatingDistribution
                        counts={{
                          count_5_star: stats.count_5_star,
                          count_4_star: stats.count_4_star,
                          count_3_star: stats.count_3_star,
                          count_2_star: stats.count_2_star,
                          count_1_star: stats.count_1_star,
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            ),
          },
          {
            id: "portfolio",
            label: "Portfolio / Gallery",
            content: (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-foreground">Portfolio</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Before &amp; after photos from {provider.business_name}&apos;s completed projects.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] rounded-xl bg-muted dark:bg-slate-800 border border-border dark:border-slate-700 flex items-center justify-center text-sm text-muted-foreground"
                    >
                      Project photo {i}
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            id: "services",
            label: "Services & Pricing",
            content: (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-foreground">Services &amp; Pricing</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Service</th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">Price Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(provider.pricing).length > 0 ? (
                        Object.entries(provider.pricing).map(([key, value]) => (
                          <tr key={key} className="border-b border-border dark:border-slate-800">
                            <td className="py-3 px-4 capitalize text-muted-foreground">
                              {key.replace(/_/g, " ")}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-foreground">
                              {typeof value === "number"
                                ? new Intl.NumberFormat("en-GB", {
                                    style: "currency",
                                    currency: "GBP",
                                  }).format(value)
                                : String(value)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-8 text-center text-muted-foreground">
                            Contact for pricing details.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          },
          {
            id: "reviews",
            label: "Reviews",
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewsList
                    reviews={reviews}
                    totalCount={reviewTotal}
                    currentPage={reviewPage}
                    sort={reviewSort}
                    onPageChange={handlePageChange}
                    onSortChange={handleSortChange}
                  />
                </CardContent>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}

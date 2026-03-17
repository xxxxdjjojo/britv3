import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/RatingStars";
import { cn } from "@/lib/utils";
import type { ServiceCategory } from "@/types/marketplace";
import { CATEGORY_LABELS } from "@/lib/marketplace/category-labels";

type ProviderCardProps = Readonly<{
  slug: string;
  business_name: string;
  services: ServiceCategory[];
  average_rating: number;
  review_count: number;
  distance_miles?: number;
  years_in_business: number;
  className?: string;
}>;

export function ProviderCard({
  slug,
  business_name,
  services,
  average_rating,
  review_count,
  distance_miles,
  years_in_business,
  className,
}: ProviderCardProps) {
  const displayedServices = services.slice(0, 3);
  const extraCount = services.length - 3;

  return (
    <Link href={`/services/${services[0] ?? "other"}/${slug}`} className="block">
      <Card
        className={cn(
          "transition-shadow hover:shadow-md hover:ring-brand-primary/20",
          className,
        )}
      >
        <CardHeader>
          <CardTitle className="truncate">{business_name}</CardTitle>
          <div className="flex flex-wrap gap-1">
            {displayedServices.map((svc) => (
              <Badge key={svc} variant="secondary" className="text-[0.65rem]">
                {CATEGORY_LABELS[svc]}
              </Badge>
            ))}
            {extraCount > 0 && (
              <Badge variant="outline" className="text-[0.65rem]">
                +{extraCount} more
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-1.5">
            <RatingStars rating={average_rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              ({review_count})
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {distance_miles !== undefined && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {distance_miles.toFixed(1)} mi
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {years_in_business} {years_in_business === 1 ? "year" : "years"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

type RatingStarsProps = Readonly<{
  rating: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showValue?: boolean;
}>;

const sizeMap = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
} as const;

export function RatingStars({
  rating,
  size = "md",
  className,
  showValue = false,
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(clamped);
  const hasHalf = clamped - fullStars >= 0.25 && clamped - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  const iconSize = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: fullStars }, (_, i) => (
        <Star
          key={`full-${i}`}
          className={cn(iconSize, "fill-brand-secondary text-brand-secondary")}
        />
      ))}
      {hasHalf && (
        <StarHalf
          className={cn(iconSize, "fill-brand-secondary text-brand-secondary")}
        />
      )}
      {Array.from({ length: emptyStars }, (_, i) => (
        <Star
          key={`empty-${i}`}
          className={cn(iconSize, "text-neutral-300")}
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          {clamped.toFixed(1)}
        </span>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Clock, AlertTriangle } from "lucide-react";
import {
  reviewEditSchema,
  type ReviewEditInput,
} from "@/lib/validators/marketplace-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/marketplace";

type EditReviewFormProps = Readonly<{
  review: Review;
  onSuccess?: () => void;
  onCancel?: () => void;
}>;

function StarRatingInput({
  label,
  value,
  onChange,
}: Readonly<{ label: string; value: number; onChange: (v: number) => void }>) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div
        className="flex items-center gap-0.5"
        role="radiogroup"
        aria-label={`${label} rating`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" && value < 5) onChange(value + 1);
          if (e.key === "ArrowLeft" && value > 1) onChange(value - 1);
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            tabIndex={star === value || (value === 0 && star === 1) ? 0 : -1}
            className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 rounded"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <svg
              className={cn(
                "size-5 transition-colors",
                (hovered || value) >= star
                  ? "fill-brand-secondary text-brand-secondary"
                  : "fill-none text-neutral-300",
              )}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function useEditWindowCountdown(createdAt: Date) {
  const [remaining, setRemaining] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const expiryMs = new Date(createdAt).getTime() + 48 * 60 * 60 * 1000;

    function update() {
      const diff = expiryMs - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setRemaining("Expired");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setRemaining(`${hours}h ${minutes}m remaining`);
    }

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return { remaining, expired };
}

export function EditReviewForm({ review, onSuccess, onCancel }: EditReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { remaining, expired } = useEditWindowCountdown(new Date(review.created_at));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewEditInput>({
    resolver: zodResolver(reviewEditSchema),
    defaultValues: {
      overall_rating: review.overall_rating,
      punctuality_rating: review.punctuality_rating ?? undefined,
      quality_rating: review.quality_rating ?? undefined,
      value_rating: review.value_rating ?? undefined,
      professionalism_rating: review.professionalism_rating ?? undefined,
      title: review.title,
      review_text: review.review_text,
    },
  });

  const overallRating = watch("overall_rating");
  const reviewText = watch("review_text") ?? "";

  async function onSubmit(data: ReviewEditInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${review.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? `Failed to edit review (${response.status})`);
      }

      toast.success("Review updated. It will be re-reviewed by our moderation team.");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to edit review");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (expired) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <AlertTriangle className="mx-auto mb-2 size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          The edit window for this review has expired. Reviews can only be edited within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Edit window indicator */}
      <div className="flex items-center gap-2 rounded-md bg-warning-light px-3 py-2 text-sm text-warning dark:bg-warning/20 dark:text-warning">
        <Clock className="size-4 shrink-0" />
        <span>{remaining}</span>
        {review.edit_count > 0 && (
          <Badge variant="outline" className="ml-auto text-xs">
            Edit {review.edit_count}/2
          </Badge>
        )}
      </div>

      {/* Moderation notice */}
      <p className="text-xs text-muted-foreground">
        Edited reviews are re-submitted for moderation and may not be visible immediately.
      </p>

      <StarRatingInput
        label="Overall Rating"
        value={overallRating}
        onChange={(v) => setValue("overall_rating", v, { shouldValidate: true })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StarRatingInput label="Punctuality" value={watch("punctuality_rating") ?? 0} onChange={(v) => setValue("punctuality_rating", v)} />
        <StarRatingInput label="Quality" value={watch("quality_rating") ?? 0} onChange={(v) => setValue("quality_rating", v)} />
        <StarRatingInput label="Value" value={watch("value_rating") ?? 0} onChange={(v) => setValue("value_rating", v)} />
        <StarRatingInput label="Professionalism" value={watch("professionalism_rating") ?? 0} onChange={(v) => setValue("professionalism_rating", v)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-title">Title</Label>
        <Input id="edit-title" {...register("title")} aria-invalid={!!errors.title} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-text">Your Review</Label>
        <Textarea id="edit-text" className="min-h-32" {...register("review_text")} aria-invalid={!!errors.review_text} />
        <div className="flex items-center justify-between">
          {errors.review_text ? (
            <p className="text-xs text-destructive">{errors.review_text.message}</p>
          ) : (
            <span />
          )}
          <span className={cn("text-xs", reviewText.length > 2000 ? "text-destructive" : "text-muted-foreground")}>
            {reviewText.length}/2000
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

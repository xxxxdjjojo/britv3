"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Star } from "lucide-react";
import {
  reviewCreateSchema,
  type ReviewCreateInput,
} from "@/lib/validators/marketplace-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ReviewFormProps = Readonly<{
  bookingId: string;
  providerId: string;
  onSuccess?: () => void;
}>;

type StarRatingInputProps = Readonly<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  error?: string;
}>;

function StarRatingInput({
  label,
  value,
  onChange,
  required = false,
  error,
}: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-1">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-0.5 transition-colors"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "size-5 transition-colors",
                (hovered || value) >= star
                  ? "fill-brand-secondary text-brand-secondary"
                  : "text-neutral-300",
              )}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {value}/5
          </span>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ReviewForm({
  bookingId,
  providerId,
  onSuccess,
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewCreateInput>({
    resolver: zodResolver(reviewCreateSchema),
    defaultValues: {
      overall_rating: 0,
      title: "",
      review_text: "",
    },
  });

  const overallRating = watch("overall_rating");
  const punctualityRating = watch("punctuality_rating") ?? 0;
  const qualityRating = watch("quality_rating") ?? 0;
  const valueRating = watch("value_rating") ?? 0;
  const professionalismRating = watch("professionalism_rating") ?? 0;
  const reviewText = watch("review_text") ?? "";

  async function onSubmit(data: ReviewCreateInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          booking_id: bookingId,
          provider_id: providerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ?? `Failed to submit review (${response.status})`,
        );
      }

      setIsSubmitted(true);
      toast.success("Review submitted successfully");
      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit review",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          Review Submitted
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for your feedback. Your review is pending moderation and
          will be published shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <StarRatingInput
        label="Overall Rating"
        value={overallRating}
        onChange={(v) => setValue("overall_rating", v, { shouldValidate: true })}
        required
        error={errors.overall_rating?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <StarRatingInput
          label="Punctuality"
          value={punctualityRating}
          onChange={(v) => setValue("punctuality_rating", v)}
        />
        <StarRatingInput
          label="Quality"
          value={qualityRating}
          onChange={(v) => setValue("quality_rating", v)}
        />
        <StarRatingInput
          label="Value for Money"
          value={valueRating}
          onChange={(v) => setValue("value_rating", v)}
        />
        <StarRatingInput
          label="Professionalism"
          value={professionalismRating}
          onChange={(v) => setValue("professionalism_rating", v)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="review-title"
          placeholder="Summarise your experience"
          {...register("title")}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-text">
          Your Review <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="review-text"
          placeholder="Share details of your experience..."
          className="min-h-32"
          {...register("review_text")}
          aria-invalid={!!errors.review_text}
        />
        <div className="flex items-center justify-between">
          {errors.review_text ? (
            <p className="text-xs text-destructive">
              {errors.review_text.message}
            </p>
          ) : (
            <span />
          )}
          <span
            className={cn(
              "text-xs",
              reviewText.length > 2000
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {reviewText.length}/2000
          </span>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}

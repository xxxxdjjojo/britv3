"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle, Briefcase } from "lucide-react";
import {
  reviewCreateSchema,
  type ReviewCreateInput,
} from "@/lib/validators/marketplace-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type BookingContext = Readonly<{
  serviceName: string;
  providerName: string;
  completedDate: string;
}>;

type ReviewFormProps = Readonly<{
  bookingId: string;
  providerId: string;
  bookingContext?: BookingContext;
  onSuccess?: () => void;
}>;

function StarRatingInput({
  label,
  value,
  onChange,
  required = false,
  error,
}: Readonly<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  error?: string;
}>) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-1">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
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
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <svg
              className={cn(
                "size-6 transition-colors",
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
        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground" aria-live="polite">
            {value}/5 — {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
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
  bookingContext,
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
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:bg-green-900/20 dark:border-green-800">
        <CheckCircle className="mx-auto mb-2 size-8 text-green-600" />
        <h3 className="text-lg font-semibold text-foreground">Review Submitted</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for your feedback. Your review is pending moderation and
          will be published shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Booking context card */}
      {bookingContext && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <Briefcase className="size-5 text-brand-primary shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {bookingContext.serviceName} by {bookingContext.providerName}
            </p>
            <p className="text-xs text-muted-foreground">
              Completed {bookingContext.completedDate}
            </p>
          </div>
        </div>
      )}

      <StarRatingInput
        label="Overall Rating"
        value={overallRating}
        onChange={(v) => setValue("overall_rating", v, { shouldValidate: true })}
        required
        error={errors.overall_rating?.message}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StarRatingInput label="Punctuality" value={watch("punctuality_rating") ?? 0} onChange={(v) => setValue("punctuality_rating", v)} />
        <StarRatingInput label="Quality" value={watch("quality_rating") ?? 0} onChange={(v) => setValue("quality_rating", v)} />
        <StarRatingInput label="Value for Money" value={watch("value_rating") ?? 0} onChange={(v) => setValue("value_rating", v)} />
        <StarRatingInput label="Professionalism" value={watch("professionalism_rating") ?? 0} onChange={(v) => setValue("professionalism_rating", v)} />
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
            <p className="text-xs text-destructive">{errors.review_text.message}</p>
          ) : (
            <span />
          )}
          <span
            className={cn(
              "text-xs",
              reviewText.length > 2000
                ? "text-destructive"
                : reviewText.length > 1800
                  ? "text-amber-600"
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

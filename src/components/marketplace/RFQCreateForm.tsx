"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  rfqCreateSchema,
  type RfqCreateInput,
} from "@/lib/validators/marketplace-schemas";
import type { ServiceCategory } from "@/types/marketplace";
import { CATEGORY_LABELS } from "@/lib/marketplace/category-labels";
import { cn } from "@/lib/utils";

const SERVICE_CATEGORY_LABELS = CATEGORY_LABELS;

type RFQCreateFormProps = Readonly<{
  defaultCategory?: ServiceCategory;
  className?: string;
}>;

export function RFQCreateForm({
  defaultCategory,
  className,
}: RFQCreateFormProps) {
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [rfqReference, setRfqReference] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(rfqCreateSchema),
    defaultValues: {
      service_category: defaultCategory ?? "other",
      urgency_level: "normal" as const,
      title: "",
      description: "",
      property_postcode: "",
      preferred_start_date: undefined as unknown as Date,
      budget_min: undefined as unknown as number,
      budget_max: undefined as unknown as number,
    },
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    setSubmitState("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/rfq/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create request");
      }
      const result = await res.json();
      setRfqReference(result.reference ?? result.id ?? "Submitted");
      setSubmitState("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong",
      );
      setSubmitState("error");
    }
  };

  if (submitState === "success") {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-6 text-center", className)}>
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">Request Submitted</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Reference: <span className="font-mono font-medium">{rfqReference}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Providers will be notified and you will receive quotes shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-5 rounded-lg border border-border bg-card p-6", className)}
    >
      <h2 className="text-lg font-semibold text-foreground">
        Request for Quotes
      </h2>

      {/* Service Category */}
      <div className="space-y-1.5">
        <Label htmlFor="rfq-category">Service category</Label>
        <select
          id="rfq-category"
          {...register("service_category")}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        >
          {Object.entries(SERVICE_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.service_category && (
          <p className="text-xs text-destructive">{errors.service_category.message}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="rfq-title">Title</Label>
        <Input
          id="rfq-title"
          placeholder="e.g. Full house survey needed"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="rfq-description">Description</Label>
        <Textarea
          id="rfq-description"
          placeholder="Describe the work you need done..."
          rows={4}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Postcode */}
      <div className="space-y-1.5">
        <Label htmlFor="rfq-postcode">Property postcode</Label>
        <Input
          id="rfq-postcode"
          placeholder="e.g. SW1A 1AA"
          {...register("property_postcode")}
        />
        <p className="text-xs text-muted-foreground">UK postcode format</p>
        {errors.property_postcode && (
          <p className="text-xs text-destructive">{errors.property_postcode.message}</p>
        )}
      </div>

      {/* Preferred start date */}
      <div className="space-y-1.5">
        <Label htmlFor="rfq-start-date">Preferred start date</Label>
        <Input
          id="rfq-start-date"
          type="date"
          {...register("preferred_start_date")}
        />
        {errors.preferred_start_date && (
          <p className="text-xs text-destructive">{errors.preferred_start_date.message}</p>
        )}
      </div>

      {/* Urgency */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Urgency</legend>
        <div className="flex flex-wrap gap-4">
          {(["low", "normal", "high", "emergency"] as const).map((level) => (
            <label key={level} className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                value={level}
                {...register("urgency_level")}
                className="accent-brand-primary"
              />
              <span className="capitalize">{level}</span>
            </label>
          ))}
        </div>
        {errors.urgency_level && (
          <p className="text-xs text-destructive">{errors.urgency_level.message}</p>
        )}
      </fieldset>

      {/* Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="rfq-budget-min">Budget min (GBP)</Label>
          <Input
            id="rfq-budget-min"
            type="number"
            min={0}
            placeholder="0"
            {...register("budget_min", { valueAsNumber: true })}
          />
          {errors.budget_min && (
            <p className="text-xs text-destructive">{errors.budget_min.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rfq-budget-max">Budget max (GBP)</Label>
          <Input
            id="rfq-budget-max"
            type="number"
            min={0}
            placeholder="0"
            {...register("budget_max", { valueAsNumber: true })}
          />
          {errors.budget_max && (
            <p className="text-xs text-destructive">{errors.budget_max.message}</p>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      <Button
        type="submit"
        disabled={submitState === "submitting"}
        className="w-full"
        size="lg"
      >
        {submitState === "submitting" ? (
          <>
            <Loader2 className="animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Request"
        )}
      </Button>
    </form>
  );
}

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
  defaultPostcode?: string;
  className?: string;
}>;

export function RFQCreateForm({
  defaultCategory,
  defaultPostcode,
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
      property_postcode: defaultPostcode ?? "",
      preferred_start_date: undefined as unknown as Date,
      budget_min: undefined as unknown as number,
      budget_max: undefined as unknown as number,
    },
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    setSubmitState("submitting");
    setErrorMessage(null);
    try {
      // Strip empty optional fields: an empty number input yields NaN and an
      // empty date input yields "" — both fail Zod validation server-side.
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, value]) => {
          if (value === "" || value == null) return false;
          if (typeof value === "number" && Number.isNaN(value)) return false;
          return true;
        }),
      );

      const res = await fetch("/api/rfq/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create request");
      }
      const result = await res.json();
      setRfqReference(result.data?.id ?? result.id ?? "Submitted");
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
      <div className={cn("rounded-xl border border-slate-200 bg-white p-8 text-center", className)}>
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-brand-primary-lighter text-brand-primary">
          <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900">Job posted</h3>
        <p className="mt-1 text-sm text-slate-500">
          Reference: <span className="font-mono font-medium text-slate-700">{rfqReference}</span>
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Verified professionals will be notified and you will receive quotes
          shortly.
        </p>
      </div>
    );
  }

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";
  const fieldClass =
    "h-auto w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base md:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-brand-primary";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-6 rounded-xl border border-slate-200 bg-white p-6", className)}
    >
      {/* Title */}
      <div>
        <Label htmlFor="rfq-title" className={labelClass}>
          Job title
        </Label>
        <Input
          id="rfq-title"
          placeholder="e.g. Install new kitchen cabinets"
          className={fieldClass}
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1.5 text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Service Category */}
      <div>
        <Label htmlFor="rfq-category" className={labelClass}>
          Category
        </Label>
        <select
          id="rfq-category"
          {...register("service_category")}
          className={cn(fieldClass, "appearance-none")}
        >
          {Object.entries(SERVICE_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.service_category && (
          <p className="mt-1.5 text-xs text-destructive">{errors.service_category.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="rfq-description" className={labelClass}>
          Project description
        </Label>
        <Textarea
          id="rfq-description"
          placeholder="Describe what needs to be done. Mention dimensions, materials, or any specific requirements..."
          rows={5}
          className={fieldClass}
          {...register("description")}
        />
        {errors.description && (
          <p className="mt-1.5 text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Postcode + Preferred start date */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="rfq-postcode" className={labelClass}>
            Location
          </Label>
          <Input
            id="rfq-postcode"
            placeholder="Enter postcode or city"
            autoComplete="postal-code"
            inputMode="text"
            className={fieldClass}
            {...register("property_postcode")}
          />
          <p className="mt-1.5 text-xs text-slate-400">UK postcode format</p>
          {errors.property_postcode && (
            <p className="mt-1 text-xs text-destructive">{errors.property_postcode.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="rfq-start-date" className={labelClass}>
            Preferred start date
          </Label>
          <Input
            id="rfq-start-date"
            type="date"
            className={fieldClass}
            {...register("preferred_start_date")}
          />
          {errors.preferred_start_date && (
            <p className="mt-1.5 text-xs text-destructive">{errors.preferred_start_date.message}</p>
          )}
        </div>
      </div>

      {/* Urgency */}
      <fieldset>
        <legend className={labelClass}>Urgency</legend>
        <div className="flex flex-wrap gap-3">
          {(["low", "normal", "high", "emergency"] as const).map((level) => (
            <label
              key={level}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary-lighter has-[:checked]:text-brand-primary"
            >
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
          <p className="mt-1.5 text-xs text-destructive">{errors.urgency_level.message}</p>
        )}
      </fieldset>

      {/* Budget */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="rfq-budget-min" className={labelClass}>
            Budget min (GBP)
          </Label>
          <Input
            id="rfq-budget-min"
            type="number"
            min={0}
            placeholder="0"
            className={fieldClass}
            {...register("budget_min", { valueAsNumber: true })}
          />
          {errors.budget_min && (
            <p className="mt-1.5 text-xs text-destructive">{errors.budget_min.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="rfq-budget-max" className={labelClass}>
            Budget max (GBP)
          </Label>
          <Input
            id="rfq-budget-max"
            type="number"
            min={0}
            placeholder="0"
            className={fieldClass}
            {...register("budget_max", { valueAsNumber: true })}
          />
          {errors.budget_max && (
            <p className="mt-1.5 text-xs text-destructive">{errors.budget_max.message}</p>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      <div className="border-t border-slate-100 pt-6">
        <Button
          type="submit"
          disabled={submitState === "submitting"}
          className="w-full rounded-lg bg-brand-primary py-3 text-base font-bold text-white shadow-md shadow-brand-primary/20 transition-all hover:bg-brand-primary-dark"
          size="lg"
        >
          {submitState === "submitting" ? (
            <>
              <Loader2 className="animate-spin" />
              Submitting...
            </>
          ) : (
            "Post job"
          )}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  providerProfileSchema,
} from "@/lib/validators/marketplace-schemas";
import type { z } from "zod";

type ProviderProfileInput = z.input<typeof providerProfileSchema>;
import type { ServiceCategory } from "@/types/marketplace";
import { CATEGORY_LABELS } from "@/lib/marketplace/category-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProviderProfileFormProps = Readonly<{
  defaultValues?: Partial<ProviderProfileInput>;
  isEdit?: boolean;
  onSuccess?: () => void;
}>;

const SERVICE_CATEGORY_LABELS = CATEGORY_LABELS;

const ALL_CATEGORIES = Object.keys(
  SERVICE_CATEGORY_LABELS,
) as ServiceCategory[];

export function ProviderProfileForm({
  defaultValues,
  isEdit = false,
  onSuccess,
}: ProviderProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postcodeInput, setPostcodeInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProviderProfileInput>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: {
      business_name: "",
      business_description: "",
      services: [],
      service_postcodes: [],
      service_radius: 25,
      years_in_business: 0,
      ...defaultValues,
    },
  });

  const selectedServices = watch("services") ?? [];
  const servicePostcodes = watch("service_postcodes") ?? [];
  const serviceRadius = watch("service_radius") ?? 25;

  function toggleService(category: ServiceCategory) {
    const current = selectedServices;
    const updated = current.includes(category)
      ? current.filter((s) => s !== category)
      : [...current, category];
    setValue("services", updated, { shouldValidate: true });
  }

  function addPostcode() {
    const trimmed = postcodeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (servicePostcodes.includes(trimmed)) {
      toast.error("Postcode already added");
      return;
    }
    setValue("service_postcodes", [...servicePostcodes, trimmed]);
    setPostcodeInput("");
  }

  function removePostcode(pc: string) {
    setValue(
      "service_postcodes",
      servicePostcodes.filter((p) => p !== pc),
    );
  }

  function handlePostcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addPostcode();
    }
  }

  async function onSubmit(data: ProviderProfileInput) {
    setIsSubmitting(true);
    try {
      const method = isEdit ? "PUT" : "POST";
      const response = await fetch("/api/providers/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ??
            `Failed to ${isEdit ? "update" : "create"} profile (${response.status})`,
        );
      }

      toast.success(
        isEdit ? "Profile updated successfully" : "Profile created successfully",
      );
      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="business_name">
          Business Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="business_name"
          placeholder="Your business name"
          {...register("business_name")}
          aria-invalid={!!errors.business_name}
        />
        {errors.business_name && (
          <p className="text-xs text-destructive">
            {errors.business_name.message}
          </p>
        )}
      </div>

      {/* Business Description */}
      <div className="space-y-2">
        <Label htmlFor="business_description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="business_description"
          placeholder="Describe your business, experience, and what sets you apart..."
          className="min-h-32"
          {...register("business_description")}
          aria-invalid={!!errors.business_description}
        />
        {errors.business_description && (
          <p className="text-xs text-destructive">
            {errors.business_description.message}
          </p>
        )}
      </div>

      {/* Services Multi-Select */}
      <div className="space-y-2">
        <Label>
          Services <span className="text-destructive">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedServices.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleService(cat)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {SERVICE_CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
        {errors.services && (
          <p className="text-xs text-destructive">{errors.services.message}</p>
        )}
      </div>

      {/* Service Postcodes */}
      <div className="space-y-2">
        <Label htmlFor="service_postcodes">Service Postcodes</Label>
        <div className="flex gap-2">
          <Input
            id="service_postcodes"
            placeholder="e.g. SW1A, EC2V"
            value={postcodeInput}
            onChange={(e) => setPostcodeInput(e.target.value)}
            onKeyDown={handlePostcodeKeyDown}
          />
          <Button type="button" variant="outline" onClick={addPostcode}>
            Add
          </Button>
        </div>
        {servicePostcodes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {servicePostcodes.map((pc) => (
              <Badge key={pc} variant="secondary" className="gap-1">
                {pc}
                <button
                  type="button"
                  onClick={() => removePostcode(pc)}
                  className="ml-0.5 rounded-full hover:text-destructive"
                  aria-label={`Remove ${pc}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Service Radius */}
      <div className="space-y-2">
        <Label htmlFor="service_radius">
          Service Radius: {serviceRadius} miles
        </Label>
        <input
          id="service_radius"
          type="range"
          min={1}
          max={100}
          className="w-full accent-primary"
          {...register("service_radius", { valueAsNumber: true })}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 mile</span>
          <span>100 miles</span>
        </div>
      </div>

      {/* Pricing */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Pricing (optional)</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="call_out_fee">Call-out Fee</Label>
            <Input
              id="call_out_fee"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              {...register("pricing.call_out_fee", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hourly_rate">Hourly Rate</Label>
            <Input
              id="hourly_rate"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              {...register("pricing.hourly_rate", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="day_rate">Day Rate</Label>
            <Input
              id="day_rate"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              {...register("pricing.day_rate", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </div>
        </div>
      </fieldset>

      {/* Website & Years */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website_url">Website URL</Label>
          <Input
            id="website_url"
            type="url"
            placeholder="https://example.com"
            {...register("website_url")}
          />
          {errors.website_url && (
            <p className="text-xs text-destructive">
              {errors.website_url.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="years_in_business">Years in Business</Label>
          <Input
            id="years_in_business"
            type="number"
            min={0}
            {...register("years_in_business", { valueAsNumber: true })}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? "Saving..."
          : isEdit
            ? "Update Profile"
            : "Create Profile"}
      </Button>
    </form>
  );
}

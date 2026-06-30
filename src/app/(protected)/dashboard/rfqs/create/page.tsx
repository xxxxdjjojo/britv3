"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  rfqCreateSchema,
} from "@/lib/validators/marketplace-schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { ServiceCategory, UrgencyLevel } from "@/types/marketplace";

type RfqFormValues = z.input<typeof rfqCreateSchema>;

const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  conveyancing: "Conveyancing",
  surveying: "Surveying",
  mortgage_broker: "Mortgage Broker",
  moving_company: "Moving Company",
  home_inspector: "Home Inspector",
  cleaning: "Cleaning",
  handyman: "Handyman",
  plumber: "Plumber",
  electrician: "Electrician",
  landscaping: "Landscaping",
  interior_design: "Interior Design",
  architect: "Architect",
  property_management: "Property Management",
  pest_control: "Pest Control",
  locksmith: "Locksmith",
  builder: "Builder",
  plasterer: "Plasterer",
  painter: "Painter",
  carpenter: "Carpenter",
  other: "Other",
};

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  low: "Low -- no rush",
  normal: "Normal",
  high: "High -- needed soon",
  emergency: "Emergency -- ASAP",
};

const PROPERTY_TRADERS_SOURCE = "property_detail_local_traders";

/**
 * Build pre-filled form defaults from deep-link query params (e.g. when a buyer
 * clicked "Request Quote" on a trader card on the property page).
 */
function prefillFromParams(params: URLSearchParams): Partial<RfqFormValues> {
  const category = params.get("category");
  const postcode = params.get("postcode");
  const address = params.get("address");
  const source = params.get("source");
  const isPropertyContext = source === PROPERTY_TRADERS_SOURCE;

  const validCategory =
    category && category in SERVICE_CATEGORY_LABELS
      ? (category as ServiceCategory)
      : undefined;

  const categoryLabel = validCategory ? SERVICE_CATEGORY_LABELS[validCategory] : null;

  return {
    ...(validCategory ? { service_category: validCategory } : {}),
    property_postcode: postcode ?? "",
    ...(address ? { property_address: address } : {}),
    title: isPropertyContext
      ? `${categoryLabel ?? "Trade"} help for this property`
      : "",
    description: isPropertyContext
      ? "I'm interested in this property and may need renovation or inspection work. Please could you share your availability and an estimated quote."
      : "",
    urgency_level: "normal",
    ...(source ? { source } : {}),
    ...(params.get("provider") ? { target_provider_id: params.get("provider")! } : {}),
    ...(params.get("listing") ? { listing_id: params.get("listing")! } : {}),
  };
}

function CreateRfqForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RfqFormValues>({
    resolver: zodResolver(rfqCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      property_postcode: "",
      urgency_level: "normal",
      ...prefillFromParams(searchParams),
    },
  });

  const urgency = watch("urgency_level") ?? "normal";
  const category = watch("service_category");

  async function onSubmit(data: RfqFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rfq/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `Failed (${res.status})`);
      }

      const rfq = await res.json();
      toast.success("RFQ created -- providers will be notified");
      router.push(`/dashboard/rfqs/${rfq.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create RFQ",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        Request for Quotes
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Describe Your Requirements</CardTitle>
          <CardDescription>
            Provide details about the service you need. Matching providers will
            be notified and can submit quotes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Attribution (hidden) — carried from the property page deep-link. */}
            <input type="hidden" {...register("source")} />
            <input type="hidden" {...register("target_provider_id")} />
            <input type="hidden" {...register("listing_id")} />

            {/* Category */}
            <div className="space-y-2">
              <Label>
                Service Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(v) =>
                  setValue("service_category", v as ServiceCategory, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_category && (
                <p className="text-xs text-destructive">
                  {errors.service_category.message}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="rfq-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rfq-title"
                placeholder="e.g. Full house survey for 3-bed semi"
                {...register("title")}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="rfq-desc">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rfq-desc"
                placeholder="Describe exactly what you need, including any specifics..."
                className="min-h-32"
                {...register("description")}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Postcode */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rfq-postcode">
                  Property Postcode <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rfq-postcode"
                  placeholder="SW1A 1AA"
                  {...register("property_postcode")}
                  aria-invalid={!!errors.property_postcode}
                />
                {errors.property_postcode && (
                  <p className="text-xs text-destructive">
                    {errors.property_postcode.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rfq-address">Property Address</Label>
                <Input
                  id="rfq-address"
                  placeholder="Optional"
                  {...register("property_address")}
                />
              </div>
            </div>

            {/* Urgency & Start Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select
                  value={urgency}
                  onValueChange={(v) =>
                    setValue("urgency_level", v as UrgencyLevel)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(URGENCY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rfq-start">Preferred Start Date</Label>
                <Input
                  id="rfq-start"
                  type="date"
                  {...register("preferred_start_date")}
                />
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rfq-budget-min">Budget Min</Label>
                <Input
                  id="rfq-budget-min"
                  type="number"
                  min={0}
                  placeholder="0.00"
                  {...register("budget_min", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rfq-budget-max">Budget Max</Label>
                <Input
                  id="rfq-budget-max"
                  type="number"
                  min={0}
                  placeholder="0.00"
                  {...register("budget_max", { valueAsNumber: true })}
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "Submit RFQ"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateRfqPage() {
  return (
    <Suspense fallback={null}>
      <CreateRfqForm />
    </Suspense>
  );
}

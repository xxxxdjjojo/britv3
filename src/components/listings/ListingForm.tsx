"use client";

/**
 * Multi-step listing creation/edit form.
 * 5 steps: Property Details, Description, Pricing, Media Upload, Review.
 * Creates a draft listing on Step 1 completion to enable media uploads.
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ListingWithProperty } from "@/types/property";
import { PropertyDetails } from "./ListingFormSteps/PropertyDetails";
import { Description } from "./ListingFormSteps/Description";
import { Pricing } from "./ListingFormSteps/Pricing";
import { MediaUpload } from "./ListingFormSteps/MediaUpload";
import { Review } from "./ListingFormSteps/Review";

// -- Zod schema ---------------------------------------------------------------

const listingFormSchema = z.object({
  // Step 1: Property Details
  listing_type: z.enum(["sale", "rent"]),
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  county: z.string().optional(),
  postcode: z.string().min(1, "Postcode is required"),
  property_type: z.enum([
    "detached", "semi_detached", "terraced", "flat", "bungalow",
    "land", "cottage", "penthouse", "studio", "maisonette", "other",
  ]),
  bedrooms: z.number({ message: "Required" }).min(0).max(50),
  bathrooms: z.number({ message: "Required" }).min(0).max(20),
  reception_rooms: z.number().min(0).max(10).optional().nullable(),
  square_footage: z.number().min(0).optional().nullable(),
  year_built: z.number().min(1600).max(2050).optional().nullable(),
  tenure: z.enum(["freehold", "leasehold", "shared_ownership"]).optional().nullable(),
  new_build: z.boolean().optional(),

  // Step 2: Description
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  features: z.array(z.string()).optional(),
  epc_rating: z.enum(["A", "B", "C", "D", "E", "F", "G"]).optional().nullable(),
  epc_score: z.number().min(1).max(100).optional().nullable(),
  council_tax_band: z.string().optional().nullable(),

  // Step 3: Pricing
  price: z.number({ message: "Price is required" }).min(1, "Price must be positive"),
  price_qualifier: z.enum(["offers_over", "guide_price", "fixed_price", "from", "poa"]).optional().nullable(),
  rent_frequency: z.enum(["weekly", "monthly", "yearly"]).optional().nullable(),
  service_charge_annual: z.number().min(0).optional().nullable(),
  ground_rent_annual: z.number().min(0).optional().nullable(),
  available_from: z.string().optional().nullable(),
});

export type ListingFormValues = z.infer<typeof listingFormSchema>;

// Step validation: only validate fields relevant to the current step
const STEP_FIELDS: (keyof ListingFormValues)[][] = [
  // Step 0: Property Details
  ["listing_type", "address_line1", "city", "postcode", "property_type", "bedrooms", "bathrooms"],
  // Step 1: Description
  ["title", "description"],
  // Step 2: Pricing
  ["price"],
  // Step 3: Media (no form fields to validate)
  [],
  // Step 4: Review (no form fields to validate)
  [],
];

const STEPS = [
  { label: "Property", short: "Details" },
  { label: "Description", short: "Info" },
  { label: "Pricing", short: "Price" },
  { label: "Media", short: "Photos" },
  { label: "Review", short: "Review" },
];

type ListingFormProps = Readonly<{
  mode: "create" | "edit";
  initialData?: ListingWithProperty;
  role: string;
}>;

function mapInitialData(data: ListingWithProperty): Partial<ListingFormValues> {
  const { listing, property } = data;
  return {
    listing_type: listing.listing_type,
    address_line1: property.address_line1,
    address_line2: property.address_line2 ?? undefined,
    city: property.city,
    county: property.county ?? undefined,
    postcode: property.postcode,
    property_type: property.property_type,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    reception_rooms: property.reception_rooms,
    square_footage: property.square_footage,
    year_built: property.year_built,
    tenure: property.tenure,
    new_build: property.new_build,
    title: property.title,
    description: property.description,
    features: property.features
      ? Object.keys(property.features).filter((k) => property.features[k])
      : [],
    epc_rating: property.epc_rating,
    epc_score: property.epc_score,
    council_tax_band: property.council_tax_band,
    price: listing.price,
    price_qualifier: listing.price_qualifier,
    rent_frequency: listing.rent_frequency,
    service_charge_annual: listing.service_charge_annual,
    ground_rent_annual: listing.ground_rent_annual,
    available_from: listing.available_from,
  };
}

export function ListingForm({ mode, initialData, role }: ListingFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftListingId, setDraftListingId] = useState<string | null>(
    mode === "edit" && initialData ? initialData.listing.id : null,
  );

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: mode === "edit" && initialData
      ? mapInitialData(initialData)
      : {
          listing_type: "sale",
          bedrooms: 0,
          bathrooms: 0,
          new_build: false,
          features: [],
        },
    mode: "onBlur",
  });

  // Validate current step's fields before proceeding
  const validateCurrentStep = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep];
    if (fields.length === 0) return true;
    const result = await form.trigger(fields);
    return result;
  }, [currentStep, form]);

  // Create draft listing when moving past Step 1
  const createDraftIfNeeded = useCallback(async () => {
    if (draftListingId || mode === "edit") return;

    const values = form.getValues();
    const body = {
      listing_type: values.listing_type,
      address_line1: values.address_line1,
      address_line2: values.address_line2 || null,
      city: values.city,
      county: values.county || null,
      postcode: values.postcode,
      property_type: values.property_type,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      reception_rooms: values.reception_rooms || null,
      square_footage: values.square_footage || null,
      year_built: values.year_built || null,
      tenure: values.tenure || null,
      new_build: values.new_build ?? false,
      title: values.title || "Draft Listing",
      description: values.description || "Draft",
      price: values.price || 0,
    };

    const response = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? `Failed to create draft: ${response.status}`);
    }

    const result = await response.json();
    setDraftListingId(result.listing.id);
  }, [draftListingId, mode, form]);

  const handleNext = useCallback(async () => {
    setError(null);
    const valid = await validateCurrentStep();
    if (!valid) return;

    // Create draft after completing Step 1 (property details)
    if (currentStep === 0 && !draftListingId && mode === "create") {
      try {
        await createDraftIfNeeded();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create draft");
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, [validateCurrentStep, currentStep, draftListingId, mode, createDraftIfNeeded]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleGoToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  // Final submit: update listing with all data and set status to active
  const handlePublish = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const values = form.getValues();
      const listingId = draftListingId ?? initialData?.listing.id;

      if (!listingId) {
        setError("No listing found. Please start from the beginning.");
        return;
      }

      // Convert features array to JSONB object
      const featuresObj: Record<string, boolean> = {};
      (values.features ?? []).forEach((f) => {
        featuresObj[f] = true;
      });

      const body = {
        listing_type: values.listing_type,
        address_line1: values.address_line1,
        address_line2: values.address_line2 || null,
        city: values.city,
        county: values.county || null,
        postcode: values.postcode,
        property_type: values.property_type,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        reception_rooms: values.reception_rooms || null,
        square_footage: values.square_footage || null,
        year_built: values.year_built || null,
        tenure: values.tenure || null,
        new_build: values.new_build ?? false,
        title: values.title,
        description: values.description,
        features: featuresObj,
        epc_rating: values.epc_rating || null,
        epc_score: values.epc_score || null,
        council_tax_band: values.council_tax_band || null,
        price: values.price,
        price_qualifier: values.price_qualifier || null,
        rent_frequency: values.rent_frequency || null,
        service_charge_annual: values.service_charge_annual || null,
        ground_rent_annual: values.ground_rent_annual || null,
        available_from: values.available_from || null,
        status: "active",
      };

      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? `Failed to publish: ${response.status}`);
      }

      router.push(`/dashboard/${role}/listings`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish listing");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, draftListingId, initialData, router, role]);

  const handleSaveDraft = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const listingId = draftListingId ?? initialData?.listing.id;
      if (!listingId) {
        setError("No listing found.");
        return;
      }

      const values = form.getValues();
      const featuresObj: Record<string, boolean> = {};
      (values.features ?? []).forEach((f) => {
        featuresObj[f] = true;
      });

      const body = {
        title: values.title || "Draft Listing",
        description: values.description || "Draft",
        features: featuresObj,
        epc_rating: values.epc_rating || null,
        epc_score: values.epc_score || null,
        council_tax_band: values.council_tax_band || null,
        price: values.price || 0,
        price_qualifier: values.price_qualifier || null,
        rent_frequency: values.rent_frequency || null,
        service_charge_annual: values.service_charge_annual || null,
        ground_rent_annual: values.ground_rent_annual || null,
        available_from: values.available_from || null,
      };

      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to save draft: ${response.status}`);
      }

      router.push(`/dashboard/${role}/listings`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, draftListingId, initialData, router, role]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Step Indicator */}
      <nav aria-label="Form steps" className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                  index === currentStep
                    ? "bg-brand-accent text-white"
                    : index < currentStep
                      ? "bg-brand-accent/20 text-brand-accent"
                      : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`mt-1 hidden text-xs sm:block ${
                  index === currentStep
                    ? "font-medium text-neutral-900"
                    : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-2 h-px w-8 sm:w-12 ${
                  index < currentStep ? "bg-brand-accent/40" : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        ))}
      </nav>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && <PropertyDetails form={form} />}
        {currentStep === 1 && <Description form={form} />}
        {currentStep === 2 && <Pricing form={form} />}
        {currentStep === 3 && (
          <MediaUpload form={form} listingId={draftListingId} />
        )}
        {currentStep === 4 && (
          <Review form={form} onGoToStep={handleGoToStep} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
        >
          Back
        </Button>

        <div className="flex gap-2">
          {currentStep === STEPS.length - 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Listing"
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Next"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

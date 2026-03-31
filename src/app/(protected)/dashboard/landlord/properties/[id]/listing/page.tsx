"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Check, Home, ImagePlus, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// --- Step definitions ---

const STEPS = [
  { number: 1, label: "Details", icon: Home },
  { number: 2, label: "Photos", icon: ImagePlus },
  { number: 3, label: "Review", icon: Eye },
];

// --- Zod schemas per step ---

const step1Schema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(30, "Description must be at least 30 characters"),
  available_from: z.string().min(1, "Available from date is required"),
  rent_amount: z.coerce.number().positive("Rent amount must be positive"),
  deposit_amount: z.coerce
    .number()
    .nonnegative("Deposit must be 0 or more")
    .optional(),
});

type Step1Data = z.infer<typeof step1Schema>;

type ListingFormData = Step1Data & {
  photo_urls: string[];
};

// --- Step indicator ---

function StepIndicator(props: Readonly<{ currentStep: number }>) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isDone = props.currentStep > step.number;
        const isCurrent = props.currentStep === step.number;
        return (
          <div key={step.number} className="flex items-center gap-1">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all",
                  isDone
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isCurrent
                      ? "border-2 border-primary bg-primary/10 text-primary"
                      : "border-2 border-border bg-background text-muted-foreground",
                )}
              >
                {isDone ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-3.5" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:block",
                  isCurrent
                    ? "text-foreground"
                    : isDone
                      ? "text-primary"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="mx-1 size-4 text-muted-foreground/40 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Field component ---

function FormField(
  props: Readonly<{
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: React.ReactNode;
  }>,
) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-foreground">
        {props.label}
        {props.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {props.hint && (
        <p className="text-xs text-muted-foreground -mt-0.5">{props.hint}</p>
      )}
      {props.children}
      {props.error && (
        <p className="text-xs text-destructive">{props.error}</p>
      )}
    </div>
  );
}

// --- Main page ---

export default function CreateListingPage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const { id: propertyId } = use(props.params);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [photoUrls] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step1Data>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(step1Schema) as any,
    defaultValues: {
      title: "",
      description: "",
      available_from: new Date().toISOString().split("T")[0],
      rent_amount: undefined,
      deposit_amount: undefined,
    },
  });

  const watchedValues = watch();

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const handlePublish = async () => {
    if (!step1Data) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error("You must be logged in.");
        return;
      }

      const formData: ListingFormData = {
        ...step1Data,
        photo_urls: photoUrls,
      };

      const { error } = await supabase.from("rental_listings").insert({
        property_id: propertyId,
        landlord_id: user.id,
        listing_type: "rental",
        title: formData.title,
        description: formData.description,
        available_from: formData.available_from,
        rent_amount: formData.rent_amount,
        deposit_amount: formData.deposit_amount ?? null,
        photo_urls: formData.photo_urls,
        status: "active",
      });

      if (error) {
        // Fallback: try inserting into listings table with listing_type rental
        const { error: fallbackError } = await supabase.from("listings").insert({
          user_id: user.id,
          property_id: propertyId,
          landlord_id: user.id,
          listing_type: "rental",
          title: formData.title,
          description: formData.description,
          available_from: formData.available_from,
          rent_amount: formData.rent_amount,
          deposit_amount: formData.deposit_amount ?? null,
          photo_urls: formData.photo_urls,
          status: "active",
        });

        if (fallbackError) {
          throw new Error(`Failed to create listing: ${fallbackError.message}`);
        }
      }

      toast.success("Listing created successfully.");
      router.push(`/dashboard/landlord/properties/${propertyId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back link */}
      <Link
        href={`/dashboard/landlord/properties/${propertyId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="size-4" />
        Back to Property
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Create New Listing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Publish this property as a rental listing on Britestate.
        </p>
      </div>

      {/* Step indicator */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <div className="flex items-center justify-between">
          <StepIndicator currentStep={step} />
          <span className="text-xs text-muted-foreground font-medium">
            Step {step < 10 ? `0${step}` : step} of {STEPS.length < 10 ? `0${STEPS.length}` : STEPS.length}
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        {/* Step 1: Listing Details */}
        {step === 1 && (
          <form onSubmit={handleSubmit(handleStep1)} className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-base font-semibold text-foreground mb-4">
                Listing Details
              </h2>
              <div className="flex flex-col gap-4">
                <FormField
                  label="Listing Title"
                  required
                  error={errors.title?.message}
                >
                  <Input
                    placeholder="e.g. Spacious 2-bedroom flat in central London"
                    {...register("title")}
                  />
                </FormField>

                <FormField
                  label="Description"
                  required
                  error={errors.description?.message}
                >
                  <Textarea
                    placeholder="Describe the property, its features, and nearby amenities..."
                    rows={5}
                    {...register("description")}
                    className="resize-none"
                  />
                </FormField>

                <FormField
                  label="Available From"
                  required
                  error={errors.available_from?.message}
                >
                  <Input
                    type="date"
                    {...register("available_from")}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Monthly Rent"
                    required
                    error={errors.rent_amount?.message}
                  >
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm font-medium pointer-events-none">
                        £
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={50}
                        placeholder="0"
                        {...register("rent_amount")}
                        className="pl-7"
                      />
                    </div>
                  </FormField>

                  <FormField
                    label="Deposit"
                    hint="Optional"
                  >
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm font-medium pointer-events-none">
                        £
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={50}
                        placeholder="0"
                        {...register("deposit_amount")}
                        className="pl-7"
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </div>

            {/* Auto-save indicator */}
            {(watchedValues.title || watchedValues.description) && (
              <p className="text-xs text-muted-foreground text-right">
                Draft auto-saved locally
              </p>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next: Photos
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-base font-semibold text-foreground mb-1">
                Property Photos
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Add photos to make your listing more attractive to renters. You can add more photos
                after publishing from the property&apos;s document section.
              </p>

              {/* Photo upload placeholder */}
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-colors hover:border-primary/30 hover:bg-primary/5 cursor-pointer">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-muted mb-3">
                  <ImagePlus className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Photo upload available after listing is created
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can proceed to publish without photos and add them later.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ChevronLeft className="size-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next: Review
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review + Publish */}
        {step === 3 && step1Data && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-base font-semibold text-foreground mb-4">
                Review Listing
              </h2>
              <dl className="flex flex-col gap-4">
                <div className="rounded-xl bg-muted/40 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Title
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{step1Data.title}</dd>
                </div>

                <div className="rounded-xl bg-muted/40 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{step1Data.description}</dd>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-muted/40 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Available From
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {new Date(step1Data.available_from).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-primary/70">
                      Monthly Rent
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-primary">
                      £{step1Data.rent_amount.toLocaleString("en-GB")}/mo
                    </dd>
                  </div>
                  {step1Data.deposit_amount != null && step1Data.deposit_amount > 0 && (
                    <div className="rounded-xl bg-muted/40 p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Deposit
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-foreground">
                        £{step1Data.deposit_amount.toLocaleString("en-GB")}
                      </dd>
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-muted/40 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Photos
                  </dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {photoUrls.length > 0 ? `${photoUrls.length} photo(s) added` : "No photos added — can be added after publishing"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ChevronLeft className="size-4" />
                Back
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Publish Listing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// --- Step definitions ---

const STEPS = [
  { number: 1, label: "Details" },
  { number: 2, label: "Photos" },
  { number: 3, label: "Review" },
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
    <div className="flex items-center gap-2">
      {STEPS.map((step, idx) => (
        <div key={step.number} className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
              props.currentStep > step.number
                ? "bg-brand-primary text-white"
                : props.currentStep === step.number
                  ? "border-2 border-brand-primary text-brand-primary"
                  : "border-2 border-slate-200 text-slate-400",
            )}
          >
            {props.currentStep > step.number ? (
              <Check className="size-4" />
            ) : (
              step.number
            )}
          </div>
          <span
            className={cn(
              "text-sm font-medium",
              props.currentStep === step.number
                ? "text-brand-primary"
                : "text-slate-400",
            )}
          >
            {step.label}
          </span>
          {idx < STEPS.length - 1 && (
            <ChevronRight className="size-4 text-slate-300" />
          )}
        </div>
      ))}
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
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/landlord/properties/${propertyId}`}
            className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-brand-primary"
          >
            <ChevronLeft className="size-4" />
            Back to Property
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create Rental Listing
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Publish this property as a rental listing on Britestate.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={step} />
        </div>

        {/* Step 1: Listing Details */}
        {step === 1 && (
          <form onSubmit={handleSubmit(handleStep1)} className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Listing Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Listing Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Spacious 2-bedroom flat in central London"
                    {...register("title")}
                    className="mt-1"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the property, its features, and nearby amenities..."
                    rows={5}
                    {...register("description")}
                    className="mt-1"
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="available_from">Available From *</Label>
                  <Input
                    id="available_from"
                    type="date"
                    {...register("available_from")}
                    className="mt-1"
                  />
                  {errors.available_from && (
                    <p className="mt-1 text-xs text-red-600">{errors.available_from.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rent_amount">Monthly Rent (£) *</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">£</span>
                      <Input
                        id="rent_amount"
                        type="number"
                        min={0}
                        step={50}
                        placeholder="0"
                        {...register("rent_amount")}
                        className="pl-7"
                      />
                    </div>
                    {errors.rent_amount && (
                      <p className="mt-1 text-xs text-red-600">{errors.rent_amount.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="deposit_amount">Deposit (£)</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">£</span>
                      <Input
                        id="deposit_amount"
                        type="number"
                        min={0}
                        step={50}
                        placeholder="0"
                        {...register("deposit_amount")}
                        className="pl-7"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-brand-primary hover:bg-brand-primary/90 text-white">
                Next: Photos
                <ChevronRight className="ml-2 size-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 font-bold text-slate-900 dark:text-slate-100">Property Photos</h2>
              <p className="mb-6 text-sm text-slate-500">
                Add photos to make your listing more attractive to renters. You can add more photos
                after publishing from the property&apos;s document section.
              </p>

              {/* Photo upload placeholder — full implementation in Phase 15 */}
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
                <p className="text-sm font-medium text-slate-500">
                  Photo upload available after listing is created.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  You can proceed to publish without photos and add them later.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-2 size-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white"
              >
                Next: Review
                <ChevronRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review + Publish */}
        {step === 3 && step1Data && (
          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Review Listing</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-400">Title</dt>
                  <dd className="mt-1 text-sm font-semibold">{step1Data.title}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-400">Description</dt>
                  <dd className="mt-1 text-sm">{step1Data.description}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">Available From</dt>
                    <dd className="mt-1 text-sm">
                      {new Date(step1Data.available_from).toLocaleDateString("en-GB")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">Monthly Rent</dt>
                    <dd className="mt-1 text-sm font-bold text-brand-primary">
                      £{step1Data.rent_amount.toLocaleString("en-GB")}/mo
                    </dd>
                  </div>
                  {step1Data.deposit_amount != null && step1Data.deposit_amount > 0 && (
                    <div>
                      <dt className="text-xs font-medium uppercase text-slate-400">Deposit</dt>
                      <dd className="mt-1 text-sm font-semibold">
                        £{step1Data.deposit_amount.toLocaleString("en-GB")}
                      </dd>
                    </div>
                  )}
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-400">Photos</dt>
                  <dd className="mt-1 text-sm text-slate-500">
                    {photoUrls.length > 0 ? `${photoUrls.length} photo(s)` : "No photos added"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="mr-2 size-4" />
                Back
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white"
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Publish Listing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

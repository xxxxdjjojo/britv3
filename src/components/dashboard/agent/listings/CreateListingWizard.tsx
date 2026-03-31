"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  MapPin,
  Home,
  Camera,
  PoundSterling,
  FileText,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type WizardData = {
  postcode: string;
  address_line_1: string;
  city: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  floor_area: number | null;
  price: number;
  pricing_qualifier: string;
  description: string;
};

const TOTAL_STEPS = 6;

const STEP_CONFIG = [
  { label: "Address", Icon: MapPin, description: "Property location" },
  { label: "Details", Icon: Home, description: "Property specs" },
  { label: "Photos", Icon: Camera, description: "Upload images" },
  { label: "Price", Icon: PoundSterling, description: "Set asking price" },
  { label: "Description", Icon: FileText, description: "Write copy" },
  { label: "Review", Icon: CheckCircle, description: "Publish listing" },
] as const;

// ============================================================================
// Step indicator
// ============================================================================

function StepIndicator({ current, total }: Readonly<{ current: number; total: number }>) {
  return (
    <div className="relative mb-8">
      {/* Track */}
      <div className="absolute left-0 right-0 top-5 h-px bg-border" />
      {/* Steps */}
      <ol className="relative flex items-start justify-between">
        {Array.from({ length: total }).map((_, i) => {
          const step = i + 1;
          const { label, Icon } = STEP_CONFIG[i];
          const isCompleted = step < current;
          const isActive = step === current;
          return (
            <li key={step} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={cn(
                  "relative z-10 flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted
                    ? "border-brand-primary bg-brand-primary text-white"
                    : isActive
                      ? "border-brand-primary bg-white text-brand-primary dark:bg-card"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={1.5} />
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  isActive ? "text-brand-primary" : isCompleted ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ============================================================================
// Field wrapper
// ============================================================================

function Field({
  label,
  error,
  hint,
  children,
}: Readonly<{ label: string; error?: string; hint?: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

// ============================================================================
// Main wizard
// ============================================================================

export function CreateListingWizard() {
  const [step, setStep] = useState(1);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WizardData>({
    mode: "onChange",
    defaultValues: {
      postcode: "",
      address_line_1: "",
      city: "",
      property_type: "",
      bedrooms: 1,
      bathrooms: 1,
      floor_area: null,
      price: 0,
      pricing_qualifier: "",
      description: "",
    },
  });

  const STEP_FIELDS: Array<(keyof WizardData)[]> = [
    ["postcode", "address_line_1", "city"],
    ["property_type", "bedrooms", "bathrooms"],
    [],
    ["price", "pricing_qualifier"],
    ["description"],
    [],
  ];

  async function goNext() {
    const fields = STEP_FIELDS[step - 1];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
  }

  function removePreview(index: number) {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function generateAiDescription() {
    setAiGenerating(true);
    try {
      const values = getValues();
      const res = await fetch("/api/agent/listings/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: values.address_line_1 + ", " + values.city,
          propertyType: values.property_type,
          bedrooms: values.bedrooms,
        }),
      });
      if (!res.ok) throw new Error("Not available");
      const json = (await res.json()) as { description?: string };
      if (json.description) {
        setValue("description", json.description);
      }
    } catch {
      toast.error("AI generation not available. Please write a description manually.");
    } finally {
      setAiGenerating(false);
    }
  }

  async function onPublish() {
    setPublishing(true);
    try {
      const values = getValues();
      const res = await fetch("/api/agent/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, status: "active" }),
      });
      if (!res.ok) throw new Error("Publish failed");
      toast.success("Listing published successfully.");
      window.location.href = "/dashboard/agent/listings";
    } catch {
      toast.error("Could not publish listing right now. Please try again later.");
    } finally {
      setPublishing(false);
    }
  }

  const values = watch();
  const { label: stepLabel, description: stepDescription } = STEP_CONFIG[step - 1];

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col gap-5">
            <Field label="Postcode" error={errors.postcode?.message} hint="e.g. SW1A 1AA">
              <Input
                {...register("postcode", { required: "Postcode is required" })}
                placeholder="SW1A 1AA"
                className="rounded-xl"
              />
            </Field>
            <Field label="Address Line 1" error={errors.address_line_1?.message}>
              <Input
                {...register("address_line_1", { required: "Address is required" })}
                placeholder="10 Downing Street"
                className="rounded-xl"
              />
            </Field>
            <Field label="City" error={errors.city?.message}>
              <Input
                {...register("city", { required: "City is required" })}
                placeholder="London"
                className="rounded-xl"
              />
            </Field>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col gap-5">
            <Field label="Property Type" error={errors.property_type?.message}>
              <Select
                value={values.property_type}
                onValueChange={(v) => setValue("property_type", v ?? "")}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="bungalow">Bungalow</SelectItem>
                  <SelectItem value="maisonette">Maisonette</SelectItem>
                </SelectContent>
              </Select>
              {errors.property_type && (
                <p className="text-xs font-medium text-destructive">{errors.property_type.message}</p>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bedrooms" error={errors.bedrooms?.message}>
                <Input
                  type="number"
                  min={0}
                  {...register("bedrooms", {
                    required: "Required",
                    valueAsNumber: true,
                    min: { value: 0, message: "Min 0" },
                  })}
                  className="rounded-xl"
                />
              </Field>
              <Field label="Bathrooms" error={errors.bathrooms?.message}>
                <Input
                  type="number"
                  min={0}
                  {...register("bathrooms", {
                    required: "Required",
                    valueAsNumber: true,
                    min: { value: 0, message: "Min 0" },
                  })}
                  className="rounded-xl"
                />
              </Field>
            </div>
            <Field label="Floor Area (sq ft)" hint="Optional">
              <Input
                type="number"
                min={0}
                {...register("floor_area", { valueAsNumber: true })}
                placeholder="e.g. 850"
                className="rounded-xl"
              />
            </Field>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-brand-primary hover:bg-brand-primary/5"
            >
              <div className="flex size-14 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-brand-primary/10">
                <Upload className="size-6 text-muted-foreground transition-colors group-hover:text-brand-primary" strokeWidth={1.25} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Drop photos here or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Up to 10 images &middot; JPEG, PNG, WebP
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </button>

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {previewUrls.map((url, i) => (
                  <div key={i} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Preview ${i + 1}`}
                      className="h-20 w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePreview(i)}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                    >
                      <X className="size-3" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col gap-5">
            <Field label="Asking Price (GBP)" error={errors.price?.message}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  £
                </span>
                <Input
                  type="number"
                  min={0}
                  {...register("price", {
                    required: "Price is required",
                    valueAsNumber: true,
                    min: { value: 1, message: "Price must be positive" },
                  })}
                  placeholder="350000"
                  className="rounded-xl pl-7"
                />
              </div>
              {values.price > 0 && (
                <p className="text-xs font-medium text-brand-primary">
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                    maximumFractionDigits: 0,
                  }).format(values.price)}
                </p>
              )}
            </Field>
            <Field label="Pricing Qualifier" error={errors.pricing_qualifier?.message}>
              <Select
                value={values.pricing_qualifier}
                onValueChange={(v) => setValue("pricing_qualifier", v ?? "")}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select qualifier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offers_over">Offers Over</SelectItem>
                  <SelectItem value="guide_price">Guide Price</SelectItem>
                  <SelectItem value="fixed_price">Fixed Price</SelectItem>
                  <SelectItem value="poa">POA</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">Property Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAiDescription}
                disabled={aiGenerating}
                className="gap-1.5 rounded-xl"
              >
                <Sparkles
                  className={cn("size-3.5 text-amber-500", aiGenerating && "animate-pulse")}
                  strokeWidth={1.25}
                />
                {aiGenerating ? "Generating…" : "AI Suggestion"}
              </Button>
            </div>
            <textarea
              {...register("description", { required: "Description is required" })}
              rows={8}
              className={cn(
                "w-full resize-y rounded-xl bg-neutral-50 ring-1 ring-neutral-200/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                errors.description && "ring-destructive ring-destructive/20",
              )}
              placeholder="Describe the property in detail — location highlights, features, finish quality…"
            />
            {errors.description && (
              <p className="text-xs font-medium text-destructive">{errors.description.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {values.description?.length ?? 0} characters &middot; aim for 200+
            </p>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl bg-muted/40 px-1 py-1">
              {[
                ["Address", [values.address_line_1, values.city, values.postcode].filter(Boolean).join(", ")],
                ["Type", values.property_type || "Not set"],
                ["Bedrooms", String(values.bedrooms)],
                ["Bathrooms", String(values.bathrooms)],
                [
                  "Floor Area",
                  values.floor_area ? `${values.floor_area} sq ft` : "Not provided",
                ],
                [
                  "Price",
                  values.price > 0
                    ? new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: "GBP",
                        maximumFractionDigits: 0,
                      }).format(values.price)
                    : "Not set",
                ],
                ["Qualifier", values.pricing_qualifier || "Not set"],
                ["Photos", previewUrls.length > 0 ? `${previewUrls.length} selected` : "None selected"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg px-4 py-3 text-sm odd:bg-card"
                >
                  <span className="font-medium text-muted-foreground">{label}</span>
                  <span className="max-w-[60%] break-words text-right font-medium text-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {values.description && (
              <div className="rounded-xl bg-card p-4 ring-1 ring-border/60">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description preview
                </p>
                <p className="text-sm leading-relaxed text-foreground line-clamp-6 whitespace-pre-wrap">
                  {values.description}
                </p>
              </div>
            )}

            <div className="rounded-xl bg-brand-primary/5 p-4 ring-1 ring-brand-primary/20">
              <p className="text-sm font-medium text-brand-primary">
                Ready to publish?
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your listing will go live immediately and appear in Britestate search results.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        {/* Page heading */}
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            New Listing
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground">
            {stepLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{stepDescription}</p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} total={TOTAL_STEPS} />

        {/* Card */}
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60 sm:p-8">
          <form onSubmit={handleSubmit(onPublish)} noValidate>
            {renderStep()}

            {/* Navigation */}
            <div className="mt-8">
              <div className="mb-6 h-px bg-border/60" />
              <div className="flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={step === 1}
                  className="gap-2 rounded-xl"
                >
                  <ChevronLeft className="size-4" strokeWidth={1.5} />
                  Back
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i + 1 === step
                          ? "w-6 bg-brand-primary"
                          : i + 1 < step
                            ? "w-1.5 bg-brand-primary/40"
                            : "w-1.5 bg-muted-foreground/20",
                      )}
                    />
                  ))}
                </div>

                {step < TOTAL_STEPS ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    className="gap-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-light"
                  >
                    Continue
                    <ChevronRight className="size-4" strokeWidth={1.5} />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={publishing}
                    className="gap-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-light"
                  >
                    {publishing ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Publishing…
                      </>
                    ) : (
                      <>
                        <CheckCircle className="size-4" strokeWidth={1.5} />
                        Publish Listing
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

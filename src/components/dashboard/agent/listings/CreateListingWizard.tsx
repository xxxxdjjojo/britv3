"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================================
// Types
// ============================================================================

type WizardData = {
  // Step 1: Address
  postcode: string;
  address_line_1: string;
  city: string;
  // Step 2: Property details
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  floor_area: number | null;
  planning_permission_status: string;
  // Step 3: Photos (handled separately via ref)
  // Step 4: Price
  price: number;
  pricing_qualifier: string;
  // Step 5: Description
  description: string;
};

const TOTAL_STEPS = 6;

// ============================================================================
// Step indicator
// ============================================================================

function StepIndicator({ current, total }: Readonly<{ current: number; total: number }>) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const isCompleted = step < current;
        const isActive = step === current;
        return (
          <div
            key={step}
            className={[
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
              isCompleted
                ? "bg-primary border-primary text-primary-foreground"
                : isActive
                  ? "border-primary text-primary"
                  : "border-muted-foreground text-muted-foreground",
            ].join(" ")}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Step labels
// ============================================================================

const STEP_LABELS = [
  "Address",
  "Property Details",
  "Photos",
  "Price",
  "Description",
  "Review & Publish",
];

// ============================================================================
// Field wrapper
// ============================================================================

function Field({
  label,
  error,
  children,
}: Readonly<{ label: string; error?: string; children: React.ReactNode }>) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
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
      planning_permission_status: "",
      price: 0,
      pricing_qualifier: "",
      description: "",
    },
  });

  // -------------------------------------------------------------------------
  // Step field groups for validation
  // -------------------------------------------------------------------------

  const STEP_FIELDS: Array<(keyof WizardData)[]> = [
    ["postcode", "address_line_1", "city"],
    ["property_type", "bedrooms", "bathrooms", "planning_permission_status"],
    [], // photos — no required fields
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

  // -------------------------------------------------------------------------
  // Photo handling
  // -------------------------------------------------------------------------

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
  }

  // -------------------------------------------------------------------------
  // AI description generation
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Publish
  // -------------------------------------------------------------------------

  async function onPublish() {
    setPublishing(true);
    try {
      const values = getValues();
      const res = await fetch("/api/agent/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          status: "active",
        }),
      });
      if (!res.ok) throw new Error("Publish failed");
      toast.success("Listing published successfully.");
      // Redirect to listings page
      window.location.href = "/dashboard/agent/listings";
    } catch {
      toast.error("Could not publish listing right now. Please try again later.");
    } finally {
      setPublishing(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const values = watch();

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Field label="Postcode" error={errors.postcode?.message}>
              <Input
                {...register("postcode", { required: "Postcode is required" })}
                placeholder="e.g. SW1A 1AA"
              />
            </Field>
            <Field label="Address Line 1" error={errors.address_line_1?.message}>
              <Input
                {...register("address_line_1", {
                  required: "Address is required",
                })}
                placeholder="e.g. 10 Downing Street"
              />
            </Field>
            <Field label="City" error={errors.city?.message}>
              <Input
                {...register("city", { required: "City is required" })}
                placeholder="e.g. London"
              />
            </Field>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Field label="Property Type" error={errors.property_type?.message}>
              <Select
                value={values.property_type}
                onValueChange={(v) => setValue("property_type", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="bungalow">Bungalow</SelectItem>
                  <SelectItem value="maisonette">Maisonette</SelectItem>
                </SelectContent>
              </Select>
              {errors.property_type && (
                <p className="text-xs text-destructive">{errors.property_type.message}</p>
              )}
            </Field>
            <Field label="Bedrooms" error={errors.bedrooms?.message}>
              <Input
                type="number"
                min={0}
                {...register("bedrooms", {
                  required: "Bedrooms required",
                  valueAsNumber: true,
                  min: { value: 0, message: "Min 0" },
                })}
              />
            </Field>
            <Field label="Bathrooms" error={errors.bathrooms?.message}>
              <Input
                type="number"
                min={0}
                {...register("bathrooms", {
                  required: "Bathrooms required",
                  valueAsNumber: true,
                  min: { value: 0, message: "Min 0" },
                })}
              />
            </Field>
            <Field label="Floor Area (sq ft, optional)">
              <Input
                type="number"
                min={0}
                {...register("floor_area", {
                  valueAsNumber: true,
                })}
                placeholder="Optional"
              />
            </Field>
            <Field
              label="Planning Permission Status"
              error={errors.planning_permission_status?.message}
            >
              <input
                type="hidden"
                {...register("planning_permission_status", {
                  required: "Planning permission status is required",
                })}
              />
              <Select
                value={values.planning_permission_status}
                onValueChange={(v) =>
                  setValue("planning_permission_status", v ?? "", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="granted">Granted</SelectItem>
                  <SelectItem value="pending">Decision pending</SelectItem>
                  <SelectItem value="refused">Refused</SelectItem>
                  <SelectItem value="none_known">None known</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Required under NTSELAT material information rules.
              </p>
            </Field>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-muted-foreground rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-muted-foreground text-sm">
                Drag & drop photos here, or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Up to 10 images. JPEG, PNG, WebP accepted.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {previewUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Preview ${i + 1}`}
                    className="h-20 w-full object-cover rounded-md"
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Field label="Price (GBP)" error={errors.price?.message}>
              <Input
                type="number"
                min={0}
                {...register("price", {
                  required: "Price is required",
                  valueAsNumber: true,
                  min: { value: 1, message: "Price must be positive" },
                })}
                placeholder="e.g. 350000"
              />
              {values.price > 0 && (
                <p className="text-xs text-muted-foreground">
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
                <SelectTrigger>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAiDescription}
                disabled={aiGenerating}
              >
                {aiGenerating ? "Generating..." : "AI Suggestion"}
              </Button>
            </div>
            <textarea
              {...register("description", {
                required: "Description is required",
              })}
              rows={8}
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="Describe the property..."
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Review your listing
            </h3>
            <div className="divide-y divide-border rounded-lg border">
              {[
                ["Address", [values.address_line_1, values.city, values.postcode].filter(Boolean).join(", ")],
                ["Property Type", values.property_type],
                ["Bedrooms", String(values.bedrooms)],
                ["Bathrooms", String(values.bathrooms)],
                [
                  "Floor Area",
                  values.floor_area ? `${values.floor_area} sq ft` : "Not provided",
                ],
                [
                  "Planning Permission",
                  {
                    granted: "Permission granted",
                    pending: "Decision pending",
                    refused: "Refused",
                    none_known: "None known",
                  }[values.planning_permission_status] ?? "Not set",
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
                ["Pricing Qualifier", values.pricing_qualifier || "Not set"],
                ["Photos", `${previewUrls.length} selected`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[60%] break-words">
                    {value}
                  </span>
                </div>
              ))}
            </div>
            {values.description && (
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">{values.description}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            New Listing — {STEP_LABELS[step - 1]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StepIndicator current={step} total={TOTAL_STEPS} />
          <form onSubmit={handleSubmit(onPublish)} noValidate>
            {renderStep()}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={step === 1}
              >
                Back
              </Button>
              {step < TOTAL_STEPS ? (
                <Button type="button" onClick={goNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={publishing}>
                  {publishing ? "Publishing..." : "Publish Listing"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

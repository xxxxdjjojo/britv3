"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Upload, Check } from "lucide-react";

// -- Schema -------------------------------------------------------------------

const listingSchema = z.object({
  // Step 0: Address
  postcode: z.string().min(1, "Postcode is required"),
  address_line_1: z.string().min(1, "Address line 1 is required"),
  address_line_2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  // Step 1: Property Details
  property_type: z.string().min(1, "Property type is required"),
  bedrooms: z.number().int().min(0, "Bedrooms is required"),
  bathrooms: z.number().int().min(0, "Bathrooms is required"),
  tenure: z.string().min(1, "Tenure is required"),
  // Step 4: Description
  description: z.string().optional(),
  // Step 5: Pricing
  price: z.number().positive("Price must be positive"),
  pricing_qualifier: z.string().min(1, "Pricing qualifier is required"),
  // Step 6: EPC
  epc_rating: z.string().min(1, "EPC rating is required"),
});

type ListingFormData = z.infer<typeof listingSchema>;

const STEPS = [
  "Address",
  "Property Details",
  "Photos",
  "Floorplan",
  "Description",
  "Pricing",
  "EPC",
  "Review & Publish",
] as const;

const PROPERTY_TYPES = [
  "Detached",
  "Semi-Detached",
  "Terraced",
  "Flat",
  "Bungalow",
  "Maisonette",
  "Cottage",
  "Town House",
] as const;

const TENURES = ["Freehold", "Leasehold", "Share of Freehold"] as const;

const PRICING_QUALIFIERS = [
  "Guide Price",
  "Offers Over",
  "Offers In Region Of",
  "Fixed Price",
  "From",
] as const;

const EPC_RATINGS = ["A", "B", "C", "D", "E", "F", "G"] as const;

// -- Component ----------------------------------------------------------------

export function CreateListingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [floorplan, setFloorplan] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      postcode: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      property_type: "",
      bedrooms: 0,
      bathrooms: 0,
      tenure: "",
      description: "",
      price: 0,
      pricing_qualifier: "",
      epc_rating: "",
    },
  });

  const values = watch();

  const fieldsForStep: Record<number, (keyof ListingFormData)[]> = {
    0: ["postcode", "address_line_1", "city"],
    1: ["property_type", "bedrooms", "bathrooms", "tenure"],
    5: ["price", "pricing_qualifier"],
    6: ["epc_rating"],
  };

  const goNext = async () => {
    const fields = fieldsForStep[step];
    if (fields) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: ListingFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        ...data,
        price: Math.round(data.price * 100), // Convert pounds to pence
        status: "active",
      };
      const res = await fetch("/api/agent/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          (json as { error?: string }).error ?? "Failed to create listing",
        );
      }
      router.push("/dashboard/agent/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleFloorplan = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFloorplan(e.target.files[0]);
    }
  };

  const formatGBP = (val: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Listing</h1>
        <p className="text-muted-foreground">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/20 text-primary cursor-pointer"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-4 ${
                  i < step ? "bg-primary/40" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 0: Address */}
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode *</Label>
                  <Input
                    id="postcode"
                    {...register("postcode")}
                    placeholder="SW1A 1AA"
                  />
                  {errors.postcode && (
                    <p className="text-sm text-destructive">
                      {errors.postcode.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line_1">Address Line 1 *</Label>
                  <Input
                    id="address_line_1"
                    {...register("address_line_1")}
                    placeholder="123 High Street"
                  />
                  {errors.address_line_1 && (
                    <p className="text-sm text-destructive">
                      {errors.address_line_1.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line_2">Address Line 2</Label>
                  <Input
                    id="address_line_2"
                    {...register("address_line_2")}
                    placeholder="Apartment 4B"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...register("city")}
                    placeholder="London"
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">
                      {errors.city.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Step 1: Property Details */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Property Type *</Label>
                  <Select
                    value={values.property_type}
                    onValueChange={(v) => setValue("property_type", v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t.toLowerCase()}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.property_type && (
                    <p className="text-sm text-destructive">
                      {errors.property_type.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms *</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min={0}
                      {...register("bedrooms", { valueAsNumber: true })}
                    />
                    {errors.bedrooms && (
                      <p className="text-sm text-destructive">
                        {errors.bedrooms.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms *</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min={0}
                      {...register("bathrooms", { valueAsNumber: true })}
                    />
                    {errors.bathrooms && (
                      <p className="text-sm text-destructive">
                        {errors.bathrooms.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tenure *</Label>
                  <Select
                    value={values.tenure}
                    onValueChange={(v) => setValue("tenure", v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenure" />
                    </SelectTrigger>
                    <SelectContent>
                      {TENURES.map((t) => (
                        <SelectItem key={t} value={t.toLowerCase()}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tenure && (
                    <p className="text-sm text-destructive">
                      {errors.tenure.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Photos */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="photos">Upload Photos</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotos}
                    />
                    <Upload className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select multiple images. Upload will be available in a future
                    update.
                  </p>
                </div>
                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((file, i) => (
                      <div
                        key={`${file.name}-${i}`}
                        className="flex h-20 items-center justify-center rounded bg-muted text-xs text-muted-foreground"
                      >
                        {file.name.slice(0, 12)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Floorplan */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="floorplan">Upload Floorplan</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="floorplan"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFloorplan}
                    />
                    <Upload className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload will be available in a future update.
                  </p>
                </div>
                {floorplan && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {floorplan.name}
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Description */}
            {step === 4 && (
              <div className="space-y-2">
                <Label htmlFor="description">Property Description</Label>
                <Textarea
                  id="description"
                  rows={8}
                  {...register("description")}
                  placeholder="Describe the property, its features, location benefits, and any other relevant details..."
                />
              </div>
            )}

            {/* Step 5: Pricing */}
            {step === 5 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (GBP) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={1000}
                    {...register("price", { valueAsNumber: true })}
                    placeholder="250000"
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">
                      {errors.price.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Pricing Qualifier *</Label>
                  <Select
                    value={values.pricing_qualifier}
                    onValueChange={(v) => setValue("pricing_qualifier", v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select qualifier" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_QUALIFIERS.map((q) => (
                        <SelectItem key={q} value={q.toLowerCase()}>
                          {q}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.pricing_qualifier && (
                    <p className="text-sm text-destructive">
                      {errors.pricing_qualifier.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Step 6: EPC */}
            {step === 6 && (
              <div className="space-y-2">
                <Label>EPC Rating *</Label>
                <Select
                  value={values.epc_rating}
                  onValueChange={(v) => setValue("epc_rating", v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select EPC rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {EPC_RATINGS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.epc_rating && (
                  <p className="text-sm text-destructive">
                    {errors.epc_rating.message}
                  </p>
                )}
              </div>
            )}

            {/* Step 7: Review & Publish */}
            {step === 7 && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <ReviewRow label="Address">
                    {values.address_line_1}
                    {values.address_line_2 ? `, ${values.address_line_2}` : ""}
                    , {values.city}, {values.postcode}
                  </ReviewRow>
                  <ReviewRow label="Type">
                    <Badge variant="outline" className="capitalize">
                      {values.property_type || "Not set"}
                    </Badge>
                  </ReviewRow>
                  <ReviewRow label="Bedrooms">{values.bedrooms}</ReviewRow>
                  <ReviewRow label="Bathrooms">{values.bathrooms}</ReviewRow>
                  <ReviewRow label="Tenure" className="capitalize">
                    {values.tenure || "Not set"}
                  </ReviewRow>
                  <ReviewRow label="Price">
                    {values.price > 0 ? formatGBP(values.price) : "Not set"}
                  </ReviewRow>
                  <ReviewRow label="Pricing Qualifier" className="capitalize">
                    {values.pricing_qualifier || "Not set"}
                  </ReviewRow>
                  <ReviewRow label="EPC Rating">
                    {values.epc_rating || "Not set"}
                  </ReviewRow>
                  <ReviewRow label="Photos">
                    {photos.length} file(s) selected
                  </ReviewRow>
                  <ReviewRow label="Floorplan">
                    {floorplan ? floorplan.name : "None"}
                  </ReviewRow>
                  {values.description && (
                    <ReviewRow label="Description">
                      <span className="line-clamp-3">
                        {values.description}
                      </span>
                    </ReviewRow>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-4 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 size-4" />
            Previous
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? "Publishing..." : "Publish Listing"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow(
  props: Readonly<{
    label: string;
    children: React.ReactNode;
    className?: string;
  }>,
) {
  return (
    <div className="flex items-start gap-3 border-b pb-2 last:border-0">
      <span className="w-36 shrink-0 text-sm font-medium text-muted-foreground">
        {props.label}
      </span>
      <span className={`text-sm ${props.className ?? ""}`}>
        {props.children}
      </span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Home,
  Image,
  FileText,
  Sparkles,
  PoundSterling,
  Zap,
  Eye,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";

// ============================================================================
// Zod schemas for each step
// ============================================================================

const step1Schema = z.object({
  address_line_1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postcode: z
    .string()
    .regex(/^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i, "Enter a valid UK postcode"),
});

const step2Schema = z.object({
  property_type: z.string().min(1, "Property type is required"),
  tenure: z.string().min(1, "Tenure is required"),
  bedrooms: z.coerce.number().int().min(0, "Bedrooms must be 0 or more"),
  bathrooms: z.coerce.number().int().min(1, "Bathrooms must be 1 or more"),
  reception_rooms: z.coerce.number().int().min(0),
  floor_area_sqm: z.coerce.number().positive().optional().or(z.literal("")),
});

const step6Schema = z.object({
  price: z.coerce.number().int().positive("Price must be positive"),
  price_qualifier: z.string().optional(),
});

const step7Schema = z.object({
  epc_rating: z.enum(["A", "B", "C", "D", "E", "F", "G"]).optional(),
});

// ============================================================================
// Full form type
// ============================================================================

type FormData = {
  // Step 1
  address_line_1: string;
  city: string;
  postcode: string;
  // Step 2
  property_type: string;
  tenure: string;
  bedrooms: number;
  bathrooms: number;
  reception_rooms: number;
  floor_area_sqm: number | "";
  // Step 3: photos tracked as local state
  // Step 4: floorplan tracked as local state
  // Step 5: AI description
  description: string;
  description_tone: "professional" | "friendly" | "luxury";
  // Step 6
  price: number;
  price_qualifier: string;
  // Step 7
  epc_rating?: "A" | "B" | "C" | "D" | "E" | "F" | "G";
};

// ============================================================================
// Step definitions
// ============================================================================

type Step = {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const STEPS: Step[] = [
  { number: 1, title: "Address", description: "Property location", icon: <MapPin className="size-4" /> },
  { number: 2, title: "Details", description: "Property information", icon: <Home className="size-4" /> },
  { number: 3, title: "Photos", description: "Upload images", icon: <Image className="size-4" /> },
  { number: 4, title: "Floorplan", description: "Upload floorplan", icon: <FileText className="size-4" /> },
  { number: 5, title: "Description", description: "AI-generated copy", icon: <Sparkles className="size-4" /> },
  { number: 6, title: "Pricing", description: "Set asking price", icon: <PoundSterling className="size-4" /> },
  { number: 7, title: "EPC", description: "Energy rating", icon: <Zap className="size-4" /> },
  { number: 8, title: "Review", description: "Review & publish", icon: <Eye className="size-4" /> },
];

// ============================================================================
// Step indicator
// ============================================================================

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="space-y-2">
      <Progress value={(current / STEPS.length) * 100} className="h-1.5" />
      <div className="flex items-center justify-between overflow-x-auto gap-1 pb-1">
        {STEPS.map((step) => {
          const isDone = step.number < current;
          const isActive = step.number === current;
          return (
            <div
              key={step.number}
              className={`flex flex-col items-center gap-1 min-w-0 flex-1 ${
                isActive ? "opacity-100" : isDone ? "opacity-70" : "opacity-40"
              }`}
            >
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ring-2 transition-colors ${
                  isDone
                    ? "bg-primary text-primary-foreground ring-primary"
                    : isActive
                      ? "bg-primary/10 text-primary ring-primary"
                      : "bg-muted text-muted-foreground ring-border"
                }`}
              >
                {isDone ? <Check className="size-3" /> : step.number}
              </div>
              <span className="hidden sm:block text-[10px] text-center leading-tight truncate w-full text-center">
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Step panels
// ============================================================================

function Step1Address({
  register,
  errors,
}: {
  register: ReturnType<typeof useForm<FormData>>["register"];
  errors: Record<string, { message?: string }>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="address_line_1">Street address *</Label>
        <Input
          id="address_line_1"
          {...register("address_line_1")}
          placeholder="123 Example Street"
          className="mt-1"
        />
        {errors.address_line_1 && (
          <p className="text-xs text-destructive mt-1">{errors.address_line_1.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Town / City *</Label>
          <Input
            id="city"
            {...register("city")}
            placeholder="London"
            className="mt-1"
          />
          {errors.city && (
            <p className="text-xs text-destructive mt-1">{errors.city.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="postcode">Postcode *</Label>
          <Input
            id="postcode"
            {...register("postcode")}
            placeholder="SW1A 2AA"
            className="mt-1 uppercase"
          />
          {errors.postcode && (
            <p className="text-xs text-destructive mt-1">{errors.postcode.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Step2Details({
  register,
  setValue,
  watch,
  errors,
}: {
  register: ReturnType<typeof useForm<FormData>>["register"];
  setValue: ReturnType<typeof useForm<FormData>>["setValue"];
  watch: ReturnType<typeof useForm<FormData>>["watch"];
  errors: Record<string, { message?: string }>;
}) {
  const propertyType = watch("property_type");
  const tenure = watch("tenure");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Property type *</Label>
          <Select
            value={propertyType ?? ""}
            onValueChange={(v) => setValue("property_type", v ?? "")}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {["Detached", "Semi-detached", "Terraced", "Flat / Apartment", "Bungalow", "Studio", "Penthouse", "Maisonette"].map((t) => (
                <SelectItem key={t} value={t.toLowerCase().replace(/\s*\/\s*/g, "_").replace(/\s+/g, "_")}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.property_type && (
            <p className="text-xs text-destructive mt-1">{errors.property_type.message}</p>
          )}
        </div>
        <div>
          <Label>Tenure *</Label>
          <Select
            value={tenure ?? ""}
            onValueChange={(v) => setValue("tenure", v ?? "")}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select tenure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="freehold">Freehold</SelectItem>
              <SelectItem value="leasehold">Leasehold</SelectItem>
              <SelectItem value="share_of_freehold">Share of Freehold</SelectItem>
            </SelectContent>
          </Select>
          {errors.tenure && (
            <p className="text-xs text-destructive mt-1">{errors.tenure.message}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="bedrooms">Bedrooms *</Label>
          <Input id="bedrooms" type="number" min={0} {...register("bedrooms")} className="mt-1" />
          {errors.bedrooms && (
            <p className="text-xs text-destructive mt-1">{errors.bedrooms.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="bathrooms">Bathrooms *</Label>
          <Input id="bathrooms" type="number" min={1} {...register("bathrooms")} className="mt-1" />
          {errors.bathrooms && (
            <p className="text-xs text-destructive mt-1">{errors.bathrooms.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="reception_rooms">Reception rooms</Label>
          <Input id="reception_rooms" type="number" min={0} {...register("reception_rooms")} className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="floor_area_sqm">Floor area (m²)</Label>
        <Input id="floor_area_sqm" type="number" min={1} step={0.1} {...register("floor_area_sqm")} placeholder="e.g. 85" className="mt-1" />
      </div>
    </div>
  );
}

function Step3Photos({
  photos,
  onPhotosChange,
}: {
  photos: File[];
  onPhotosChange: (files: File[]) => void;
}) {
  const MAX_PHOTOS = 30;

  async function handleFiles(files: FileList) {
    const newFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (photos.length + newFiles.length >= MAX_PHOTOS) break;
      if (file.type.startsWith("image/")) {
        newFiles.push(file);
      }
    }
    onPhotosChange([...photos, ...newFiles]);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload up to {MAX_PHOTOS} photos. The first photo will be used as the thumbnail.
      </p>
      <label
        htmlFor="photo-upload"
        className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
      >
        <Upload className="size-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground text-center">
          Drag &amp; drop photos here, or <span className="text-primary underline">browse</span>
        </span>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </label>
      {photos.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            {photos.length} / {MAX_PHOTOS} photos selected
          </p>
          <div className="grid grid-cols-4 gap-2">
            {photos.map((file, i) => (
              <div key={i} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Photo ${i + 1}`}
                  className="h-16 w-full rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={() => onPhotosChange(photos.filter((_, j) => j !== i))}
                  className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/50 rounded-md text-white text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Step4Floorplan({
  floorplan,
  onFloorplanChange,
}: {
  floorplan: File | null;
  onFloorplanChange: (file: File | null) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload a floorplan image or PDF. This helps buyers understand the layout.
      </p>
      {floorplan ? (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <FileText className="size-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{floorplan.name}</p>
            <p className="text-xs text-muted-foreground">{(floorplan.size / 1024).toFixed(0)} KB</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onFloorplanChange(null)}>
            Remove
          </Button>
        </div>
      ) : (
        <label
          htmlFor="floorplan-upload"
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
        >
          <Upload className="size-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground text-center">
            Upload floorplan (image or PDF)
          </span>
          <input
            id="floorplan-upload"
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFloorplanChange(file);
            }}
          />
        </label>
      )}
      <p className="text-xs text-muted-foreground">Optional — you can add or update this later.</p>
    </div>
  );
}

const TONES = [
  { value: "professional", label: "Professional", description: "Clear, authoritative language for discerning buyers" },
  { value: "friendly", label: "Friendly", description: "Warm, approachable tone that feels welcoming" },
  { value: "luxury", label: "Luxury", description: "Aspirational language for premium properties" },
] as const;

type Tone = "professional" | "friendly" | "luxury";

function Step5Description({
  watch,
  setValue,
  address,
  propertyType,
  bedrooms,
}: {
  watch: ReturnType<typeof useForm<FormData>>["watch"];
  setValue: ReturnType<typeof useForm<FormData>>["setValue"];
  address: string;
  propertyType: string;
  bedrooms: number;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [regenerationsUsed, setRegenerationsUsed] = useState(0);
  const MAX_REGENERATIONS = 3;

  const description = watch("description");
  const tone = watch("description_tone") ?? "professional";

  async function generateDescription() {
    if (regenerationsUsed >= MAX_REGENERATIONS) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/agent/listings/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, property_type: propertyType, bedrooms, tone }),
      });
      if (res.ok) {
        const data = (await res.json()) as { description: string };
        setValue("description", data.description);
        setRegenerationsUsed((n) => n + 1);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Description tone</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValue("description_tone", t.value as Tone)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                tone === t.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateDescription}
          disabled={isGenerating || regenerationsUsed >= MAX_REGENERATIONS}
        >
          {isGenerating ? (
            <Loader2 className="mr-1 size-3 animate-spin" />
          ) : (
            <Sparkles className="mr-1 size-3" />
          )}
          {description ? "Regenerate" : "Generate"} with AI
        </Button>
        {regenerationsUsed > 0 && (
          <span className="text-xs text-muted-foreground">
            {MAX_REGENERATIONS - regenerationsUsed} generation{MAX_REGENERATIONS - regenerationsUsed === 1 ? "" : "s"} remaining
          </span>
        )}
        {description && regenerationsUsed < MAX_REGENERATIONS && (
          <button
            type="button"
            onClick={generateDescription}
            disabled={isGenerating}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <RefreshCw className="size-3" />
            Regenerate
          </button>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={8}
          value={description ?? ""}
          onChange={(e) => setValue("description", e.target.value)}
          placeholder="Write a description or use AI to generate one..."
          className="mt-1"
        />
      </div>
    </div>
  );
}

function Step6Pricing({
  register,
  setValue,
  watch,
  errors,
}: {
  register: ReturnType<typeof useForm<FormData>>["register"];
  setValue: ReturnType<typeof useForm<FormData>>["setValue"];
  watch: ReturnType<typeof useForm<FormData>>["watch"];
  errors: Record<string, { message?: string }>;
}) {
  const priceQualifier = watch("price_qualifier");

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="price">Asking price (£) *</Label>
        <Input
          id="price"
          type="number"
          min={1}
          step={1000}
          {...register("price")}
          placeholder="450000"
          className="mt-1"
        />
        {errors.price && (
          <p className="text-xs text-destructive mt-1">{errors.price.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Enter the price in pounds (not pence).</p>
      </div>

      <div>
        <Label>Price qualifier</Label>
        <Select
          value={priceQualifier ?? ""}
          onValueChange={(v) => setValue("price_qualifier", v ?? "")}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            <SelectItem value="guide_price">Guide Price</SelectItem>
            <SelectItem value="offers_over">Offers Over</SelectItem>
            <SelectItem value="offers_in_excess_of">Offers in Excess Of</SelectItem>
            <SelectItem value="oieo">OIEO</SelectItem>
            <SelectItem value="poa">Price on Application (POA)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Step7Epc({
  setValue,
  watch,
}: {
  setValue: ReturnType<typeof useForm<FormData>>["setValue"];
  watch: ReturnType<typeof useForm<FormData>>["watch"];
}) {
  const epcRating = watch("epc_rating");
  const RATINGS = ["A", "B", "C", "D", "E", "F", "G"] as const;
  const RATING_COLORS: Record<string, string> = {
    A: "bg-green-600 text-white",
    B: "bg-green-400 text-white",
    C: "bg-yellow-400 text-black",
    D: "bg-yellow-500 text-black",
    E: "bg-orange-500 text-white",
    F: "bg-red-500 text-white",
    G: "bg-red-700 text-white",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select the property&rsquo;s EPC (Energy Performance Certificate) rating. This is required
        for all listed properties.
      </p>
      <div className="flex gap-2 flex-wrap">
        {RATINGS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setValue("epc_rating", r)}
            className={`flex size-12 items-center justify-center rounded-lg text-lg font-bold ring-2 transition-all ${
              RATING_COLORS[r]
            } ${epcRating === r ? "ring-primary ring-offset-2" : "ring-transparent opacity-60 hover:opacity-100"}`}
          >
            {r}
          </button>
        ))}
      </div>
      {epcRating && (
        <p className="text-sm">
          Selected: <Badge variant="outline">EPC Rating {epcRating}</Badge>
        </p>
      )}
    </div>
  );
}

function Step8Review({
  watch,
  photos,
  floorplan,
}: {
  watch: ReturnType<typeof useForm<FormData>>["watch"];
  photos: File[];
  floorplan: File | null;
}) {
  const values = watch();

  function formatPrice(p: number | ""): string {
    if (!p) return "Not set";
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(Number(p));
  }

  const rows = [
    { label: "Address", value: [values.address_line_1, values.city, values.postcode].filter(Boolean).join(", ") || "Not set" },
    { label: "Property type", value: values.property_type || "Not set" },
    { label: "Tenure", value: values.tenure || "Not set" },
    { label: "Bedrooms", value: values.bedrooms ?? "Not set" },
    { label: "Bathrooms", value: values.bathrooms ?? "Not set" },
    { label: "Price", value: formatPrice(values.price) },
    { label: "EPC rating", value: values.epc_rating ?? "Not provided" },
    { label: "Photos", value: `${photos.length} uploaded` },
    { label: "Floorplan", value: floorplan ? floorplan.name : "Not uploaded" },
    { label: "Description", value: values.description ? `${values.description.slice(0, 80)}…` : "Not set" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Review your listing before publishing. You can go back and edit any step.
      </p>
      <div className="rounded-lg border divide-y">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="text-right font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main wizard component
// ============================================================================

const STEP_SCHEMAS: Record<number, z.ZodSchema> = {
  1: step1Schema,
  2: step2Schema,
  6: step6Schema,
  7: step7Schema,
};

export function CreateListingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [floorplan, setFloorplan] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      address_line_1: "",
      city: "",
      postcode: "",
      property_type: "",
      tenure: "",
      bedrooms: 3,
      bathrooms: 1,
      reception_rooms: 1,
      floor_area_sqm: "",
      description: "",
      description_tone: "professional",
      price: 0,
      price_qualifier: "",
      epc_rating: undefined,
    },
  });

  const { register, setValue, watch, handleSubmit, formState: { errors } } = form;

  async function validateCurrentStep(): Promise<boolean> {
    const schema = STEP_SCHEMAS[currentStep];
    if (!schema) return true;

    const values = watch();
    const result = await schema.safeParseAsync(values);
    if (!result.success) {
      // Trigger validation display by using zodResolver inline
      const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      Object.entries(fieldErrors).forEach(([field, msgs]) => {
        form.setError(field as keyof FormData, { message: msgs?.[0] ?? undefined });
      });
      return false;
    }
    return true;
  }

  async function goNext() {
    const valid = await validateCurrentStep();
    if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  }

  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  async function onSubmit() {
    setIsSubmitting(true);
    try {
      const values = watch();

      // Build FormData for file uploads
      const formData = new FormData();
      formData.append("data", JSON.stringify({
        address_line_1: values.address_line_1,
        city: values.city,
        postcode: values.postcode,
        property_type: values.property_type,
        tenure: values.tenure,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        reception_rooms: values.reception_rooms,
        floor_area_sqm: values.floor_area_sqm || null,
        description: values.description,
        // Price stored in pence
        price: values.price ? values.price * 100 : null,
        price_qualifier: values.price_qualifier || null,
        epc_rating: values.epc_rating ?? null,
        status: "active",
        title: `${values.bedrooms} bed ${values.property_type} in ${values.city}`,
      }));

      photos.forEach((photo) => formData.append("photos", photo));
      if (floorplan) formData.append("floorplan", floorplan);

      const res = await fetch("/api/agent/listings", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        router.push("/dashboard/agent/listings");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const values = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <StepIndicator current={currentStep} />

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            {STEPS[currentStep - 1].icon}
            <div>
              <CardTitle className="text-base">{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <Step1Address
              register={register}
              errors={errors as Record<string, { message?: string }>}
            />
          )}
          {currentStep === 2 && (
            <Step2Details
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors as Record<string, { message?: string }>}
            />
          )}
          {currentStep === 3 && (
            <Step3Photos photos={photos} onPhotosChange={setPhotos} />
          )}
          {currentStep === 4 && (
            <Step4Floorplan floorplan={floorplan} onFloorplanChange={setFloorplan} />
          )}
          {currentStep === 5 && (
            <Step5Description
              watch={watch}
              setValue={setValue}
              address={values.address_line_1}
              propertyType={values.property_type}
              bedrooms={values.bedrooms}
            />
          )}
          {currentStep === 6 && (
            <Step6Pricing
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors as Record<string, { message?: string }>}
            />
          )}
          {currentStep === 7 && (
            <Step7Epc setValue={setValue} watch={watch} />
          )}
          {currentStep === 8 && (
            <Step8Review watch={watch} photos={photos} floorplan={floorplan} />
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-1 size-4" />
          Back
        </Button>

        {currentStep < STEPS.length ? (
          <Button type="button" onClick={goNext}>
            Next
            <ChevronRight className="ml-1 size-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Check className="mr-2 size-4" />
            )}
            Publish listing
          </Button>
        )}
      </div>
    </form>
  );
}

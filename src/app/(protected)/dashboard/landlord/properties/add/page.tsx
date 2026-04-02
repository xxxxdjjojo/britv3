"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const addPropertySchema = z.object({
  address_line_1: z.string().min(5, "Address required"),
  address_line_2: z.string().optional(),
  city: z.string().min(2, "City required"),
  postcode: z
    .string()
    .regex(/^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i, "Valid UK postcode required"),
  property_type: z.enum(["detached", "semi_detached", "terraced", "flat", "bungalow", "studio", "other"]),
  bedrooms: z.coerce.number().min(0).max(20),
  bathrooms: z.coerce.number().min(1).max(10),
  purchase_price: z.coerce.number().positive().optional().or(z.literal(undefined)),
});

type AddPropertyFormData = z.infer<typeof addPropertySchema>;

const PROPERTY_TYPES = [
  { value: "detached", label: "House (Detached)" },
  { value: "semi_detached", label: "Semi-Detached" },
  { value: "terraced", label: "Terraced" },
  { value: "flat", label: "Flat" },
  { value: "bungalow", label: "Bungalow" },
  { value: "studio", label: "Studio" },
  { value: "other", label: "Other" },
];

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
      {props.children}
      {props.hint && (
        <p className="text-xs text-muted-foreground">{props.hint}</p>
      )}
      {props.error && (
        <p className="text-xs text-destructive">{props.error}</p>
      )}
    </div>
  );
}

export default function AddPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddPropertyFormData>({
    resolver: zodResolver(addPropertySchema) as Resolver<AddPropertyFormData>,
    defaultValues: {
      bedrooms: 1,
      bathrooms: 1,
      property_type: "flat",
    },
  });

  const onSubmit = async (data: AddPropertyFormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error("You must be logged in to add a property.");
        return;
      }

      const { data: property, error: propError } = await supabase
        .from("properties")
        .insert({
          address_line1: data.address_line_1,
          address_line2: data.address_line_2 || null,
          city: data.city,
          postcode: data.postcode.toUpperCase(),
          property_type: data.property_type,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          title: `${data.bedrooms} bed ${data.property_type.replace("_", "-")} in ${data.city}`,
          description: `${data.bedrooms} bedroom ${data.property_type.replace("_", " ")} located in ${data.city}, ${data.postcode.toUpperCase()}.`,
        })
        .select("id")
        .single();

      if (propError || !property) {
        throw new Error(propError?.message ?? "Failed to create property record");
      }

      const { data: listing, error: listError } = await supabase
        .from("listings")
        .insert({
          property_id: property.id,
          user_id: user.id,
          listing_type: "rent",
          status: "draft",
          price: data.purchase_price ?? 0,
          rent_frequency: "monthly",
        })
        .select("id")
        .single();

      if (listError || !listing) {
        throw new Error(listError?.message ?? "Failed to create listing");
      }

      fetch("/api/dashboard?refresh=true").catch(() => {});
      toast.success("Property added to your portfolio.");
      router.push(`/dashboard/landlord/properties/${listing.id}`);
      router.refresh();
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
        href="/dashboard/landlord/properties"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="size-4" />
        Back to Properties
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Home className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Add Property
          </h1>
          <p className="text-sm text-muted-foreground">
            Add a new rental property to your portfolio.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto w-full max-w-2xl flex flex-col gap-5"
      >
        {/* Address */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">
            Property Address
          </h2>
          <div className="flex flex-col gap-4">
            <FormField
              label="Address Line 1"
              required
              error={errors.address_line_1?.message}
            >
              <Input
                placeholder="e.g. 24 Maple Gardens"
                {...register("address_line_1")}
              />
            </FormField>

            <FormField label="Address Line 2">
              <Input
                placeholder="Flat number, building name (optional)"
                {...register("address_line_2")}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="City"
                required
                error={errors.city?.message}
              >
                <Input
                  placeholder="e.g. London"
                  {...register("city")}
                />
              </FormField>

              <FormField
                label="Postcode"
                required
                error={errors.postcode?.message}
              >
                <Input
                  placeholder="e.g. SW1A 1AA"
                  {...register("postcode")}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">
            Property Details
          </h2>
          <div className="flex flex-col gap-4">
            <FormField
              label="Property Type"
              required
              error={errors.property_type?.message}
            >
              <Select
                defaultValue="flat"
                onValueChange={(value) =>
                  setValue("property_type", value as AddPropertyFormData["property_type"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Bedrooms"
                required
                error={errors.bedrooms?.message}
              >
                <Input
                  type="number"
                  min={0}
                  max={20}
                  {...register("bedrooms")}
                />
              </FormField>

              <FormField
                label="Bathrooms"
                required
                error={errors.bathrooms?.message}
              >
                <Input
                  type="number"
                  min={1}
                  max={10}
                  {...register("bathrooms")}
                />
              </FormField>
            </div>

            <FormField
              label="Purchase Price"
              hint="Used to calculate gross yield. Can be added later."
              error={errors.purchase_price?.message}
            >
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm font-medium pointer-events-none">
                  £
                </span>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="0"
                  {...register("purchase_price")}
                  className="pl-7"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/landlord/properties">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Add Property
          </Button>
        </div>
      </form>
    </div>
  );
}

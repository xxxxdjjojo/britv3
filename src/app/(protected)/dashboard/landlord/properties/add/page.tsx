"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
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
  property_type: z.enum(["house", "flat", "bungalow", "studio", "room"]),
  bedrooms: z.coerce.number().min(0).max(20),
  bathrooms: z.coerce.number().min(1).max(10),
  purchase_price: z.coerce.number().positive().optional().or(z.literal(undefined)),
});

type AddPropertyFormData = z.infer<typeof addPropertySchema>;

const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "flat", label: "Flat" },
  { value: "bungalow", label: "Bungalow" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Room" },
];

export default function AddPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddPropertyFormData>({
    resolver: zodResolver(addPropertySchema),
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

      const { data: newProperty, error } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2 || null,
          city: data.city,
          postcode: data.postcode.toUpperCase(),
          property_type: data.property_type,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          purchase_price: data.purchase_price ?? null,
          listing_type: "rental",
          is_rental: true,
          status: "draft",
        })
        .select("id")
        .single();

      if (error || !newProperty) {
        throw new Error(error?.message ?? "Failed to create property");
      }

      toast.success("Property added to your portfolio.");
      router.push(`/dashboard/landlord/properties/${newProperty.id}`);
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
            href="/dashboard/landlord/properties"
            className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-[#1B4D3E]"
          >
            <ChevronLeft className="size-4" />
            Back to Properties
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Add Property
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Add a new rental property to your portfolio.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Address */}
          <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Property Address</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address_line_1">Address Line 1 *</Label>
                <Input
                  id="address_line_1"
                  placeholder="e.g. 24 Maple Gardens"
                  {...register("address_line_1")}
                  className="mt-1"
                />
                {errors.address_line_1 && (
                  <p className="mt-1 text-xs text-red-600">{errors.address_line_1.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="address_line_2">Address Line 2</Label>
                <Input
                  id="address_line_2"
                  placeholder="Flat number, building name (optional)"
                  {...register("address_line_2")}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="e.g. London"
                    {...register("city")}
                    className="mt-1"
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode *</Label>
                  <Input
                    id="postcode"
                    placeholder="e.g. SW1A 1AA"
                    {...register("postcode")}
                    className="mt-1"
                  />
                  {errors.postcode && (
                    <p className="mt-1 text-xs text-red-600">{errors.postcode.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Property Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="property_type">Property Type *</Label>
                <Select
                  defaultValue="flat"
                  onValueChange={(value) =>
                    setValue("property_type", value as AddPropertyFormData["property_type"])
                  }
                >
                  <SelectTrigger className="mt-1">
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
                {errors.property_type && (
                  <p className="mt-1 text-xs text-red-600">{errors.property_type.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={0}
                    max={20}
                    {...register("bedrooms")}
                    className="mt-1"
                  />
                  {errors.bedrooms && (
                    <p className="mt-1 text-xs text-red-600">{errors.bedrooms.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms *</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min={1}
                    max={10}
                    {...register("bathrooms")}
                    className="mt-1"
                  />
                  {errors.bathrooms && (
                    <p className="mt-1 text-xs text-red-600">{errors.bathrooms.message}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="purchase_price">Purchase Price (optional)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">£</span>
                  <Input
                    id="purchase_price"
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="0"
                    {...register("purchase_price")}
                    className="pl-7"
                  />
                </div>
                {errors.purchase_price && (
                  <p className="mt-1 text-xs text-red-600">{errors.purchase_price.message}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Used to calculate gross yield. Can be added later.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/landlord/properties">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1B4D3E] hover:bg-[#1B4D3E]/90 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add Property
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

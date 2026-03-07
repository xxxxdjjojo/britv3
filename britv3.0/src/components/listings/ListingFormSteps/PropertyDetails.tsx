"use client";

import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ListingFormValues } from "../ListingForm";

const PROPERTY_TYPES = [
  { value: "detached", label: "Detached" },
  { value: "semi_detached", label: "Semi-Detached" },
  { value: "terraced", label: "Terraced" },
  { value: "flat", label: "Flat / Apartment" },
  { value: "bungalow", label: "Bungalow" },
  { value: "land", label: "Land" },
  { value: "cottage", label: "Cottage" },
  { value: "penthouse", label: "Penthouse" },
  { value: "studio", label: "Studio" },
  { value: "maisonette", label: "Maisonette" },
  { value: "other", label: "Other" },
] as const;

const TENURE_TYPES = [
  { value: "freehold", label: "Freehold" },
  { value: "leasehold", label: "Leasehold" },
  { value: "shared_ownership", label: "Shared Ownership" },
] as const;

export function PropertyDetails(
  props: Readonly<{ form: UseFormReturn<ListingFormValues> }>,
) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = props.form;

  const listingType = watch("listing_type");

  return (
    <div className="space-y-6">
      {/* Listing Type */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-900">
          Listing Type
        </legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="sale"
              {...register("listing_type")}
              className="size-4 accent-brand-accent"
            />
            <span className="text-sm text-neutral-700">For Sale</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="rent"
              {...register("listing_type")}
              className="size-4 accent-brand-accent"
            />
            <span className="text-sm text-neutral-700">For Rent</span>
          </label>
        </div>
        {errors.listing_type && (
          <p className="text-xs text-error">{errors.listing_type.message}</p>
        )}
      </fieldset>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-neutral-900">Address</h3>

        <div className="space-y-2">
          <Label htmlFor="address_line1">Address Line 1</Label>
          <Input
            id="address_line1"
            placeholder="e.g. 10 Downing Street"
            aria-invalid={!!errors.address_line1}
            {...register("address_line1")}
          />
          {errors.address_line1 && (
            <p className="text-xs text-error">
              {errors.address_line1.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address_line2">Address Line 2 (optional)</Label>
          <Input
            id="address_line2"
            placeholder="e.g. Westminster"
            {...register("address_line2")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City / Town</Label>
            <Input
              id="city"
              placeholder="e.g. London"
              aria-invalid={!!errors.city}
              {...register("city")}
            />
            {errors.city && (
              <p className="text-xs text-error">{errors.city.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="county">County (optional)</Label>
            <Input
              id="county"
              placeholder="e.g. Greater London"
              {...register("county")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            placeholder="e.g. SW1A 2AA"
            aria-invalid={!!errors.postcode}
            {...register("postcode")}
          />
          {errors.postcode && (
            <p className="text-xs text-error">{errors.postcode.message}</p>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-neutral-900">
          Property Details
        </h3>

        <div className="space-y-2">
          <Label htmlFor="property_type">Property Type</Label>
          <Select
            value={watch("property_type") ?? ""}
            onValueChange={(val) =>
              setValue("property_type", val as ListingFormValues["property_type"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="property_type" aria-invalid={!!errors.property_type}>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>
                  {pt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.property_type && (
            <p className="text-xs text-error">
              {errors.property_type.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              type="number"
              min={0}
              max={50}
              aria-invalid={!!errors.bedrooms}
              {...register("bedrooms", { valueAsNumber: true })}
            />
            {errors.bedrooms && (
              <p className="text-xs text-error">{errors.bedrooms.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input
              id="bathrooms"
              type="number"
              min={0}
              max={20}
              step={0.5}
              aria-invalid={!!errors.bathrooms}
              {...register("bathrooms", { valueAsNumber: true })}
            />
            {errors.bathrooms && (
              <p className="text-xs text-error">{errors.bathrooms.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reception_rooms">Receptions</Label>
            <Input
              id="reception_rooms"
              type="number"
              min={0}
              max={10}
              {...register("reception_rooms", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="square_footage">Sq Ft (optional)</Label>
            <Input
              id="square_footage"
              type="number"
              min={0}
              {...register("square_footage", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year_built">Year Built (optional)</Label>
            <Input
              id="year_built"
              type="number"
              min={1600}
              max={2050}
              {...register("year_built", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenure">Tenure</Label>
          <Select
            value={watch("tenure") ?? ""}
            onValueChange={(val) =>
              setValue("tenure", val as ListingFormValues["tenure"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="tenure">
              <SelectValue placeholder="Select tenure" />
            </SelectTrigger>
            <SelectContent>
              {TENURE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="new_build"
            checked={watch("new_build") ?? false}
            onCheckedChange={(checked) =>
              setValue("new_build", checked === true)
            }
          />
          <Label htmlFor="new_build" className="cursor-pointer">
            New Build
          </Label>
        </div>
      </div>
    </div>
  );
}

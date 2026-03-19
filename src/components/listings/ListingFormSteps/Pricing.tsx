"use client";

import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ListingFormValues } from "../ListingForm";

const PRICE_QUALIFIERS = [
  { value: "offers_over", label: "Offers Over" },
  { value: "guide_price", label: "Guide Price" },
  { value: "fixed_price", label: "Fixed Price" },
  { value: "from", label: "From" },
  { value: "poa", label: "Price on Application" },
] as const;

const RENT_FREQUENCIES = [
  { value: "weekly", label: "Per Week" },
  { value: "monthly", label: "Per Month" },
  { value: "yearly", label: "Per Year" },
] as const;

export function Pricing(
  props: Readonly<{ form: UseFormReturn<ListingFormValues> }>,
) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = props.form;

  const listingType = watch("listing_type");
  const tenure = watch("tenure");

  return (
    <div className="space-y-6">
      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">
          Price {listingType === "rent" ? "(Rent)" : ""}
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
            &pound;
          </span>
          <Input
            id="price"
            type="number"
            min={0}
            step={1}
            className="pl-7"
            placeholder="e.g. 350000"
            aria-invalid={!!errors.price}
            {...register("price", { valueAsNumber: true })}
          />
        </div>
        {errors.price && (
          <p className="text-xs text-error">{errors.price.message}</p>
        )}
      </div>

      {/* Price Qualifier */}
      <div className="space-y-2">
        <Label htmlFor="price_qualifier">Price Qualifier (optional)</Label>
        <Select
          value={watch("price_qualifier") ?? ""}
          onValueChange={(val) =>
            setValue(
              "price_qualifier",
              val as ListingFormValues["price_qualifier"],
            )
          }
        >
          <SelectTrigger id="price_qualifier">
            <SelectValue placeholder="Select qualifier" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_QUALIFIERS.map((pq) => (
              <SelectItem key={pq.value} value={pq.value}>
                {pq.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rent Frequency (only for rent) */}
      {listingType === "rent" && (
        <div className="space-y-2">
          <Label htmlFor="rent_frequency">Rent Frequency</Label>
          <Select
            value={watch("rent_frequency") ?? "monthly"}
            onValueChange={(val) =>
              setValue(
                "rent_frequency",
                val as ListingFormValues["rent_frequency"],
              )
            }
          >
            <SelectTrigger id="rent_frequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {RENT_FREQUENCIES.map((rf) => (
                <SelectItem key={rf.value} value={rf.value}>
                  {rf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.rent_frequency && (
            <p className="text-xs text-error">
              {errors.rent_frequency.message}
            </p>
          )}
        </div>
      )}

      {/* Leasehold charges */}
      {tenure === "leasehold" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="service_charge_annual">
              Service Charge p/a (optional)
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
                &pound;
              </span>
              <Input
                id="service_charge_annual"
                type="number"
                min={0}
                className="pl-7"
                {...register("service_charge_annual", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground_rent_annual">
              Ground Rent p/a (optional)
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
                &pound;
              </span>
              <Input
                id="ground_rent_annual"
                type="number"
                min={0}
                className="pl-7"
                {...register("ground_rent_annual", { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Available From */}
      <div className="space-y-2">
        <Label htmlFor="available_from">Available From (optional)</Label>
        <Input
          id="available_from"
          type="date"
          {...register("available_from")}
        />
      </div>
    </div>
  );
}

"use client";

import type { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import type { ListingFormValues } from "../ListingForm";

const PLANNING_PERMISSION_LABELS: Record<string, string> = {
  granted: "Permission granted",
  pending: "Decision pending",
  refused: "Refused",
  none_known: "None known",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(price);
}

function SectionHeader(
  props: Readonly<{
    title: string;
    step: number;
    onEdit: (step: number) => void;
  }>,
) {
  return (
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-neutral-900">
        {props.title}
      </CardTitle>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => props.onEdit(props.step)}
        className="gap-1 text-xs"
      >
        <Pencil className="size-3" />
        Edit
      </Button>
    </CardHeader>
  );
}

export function Review(
  props: Readonly<{
    form: UseFormReturn<ListingFormValues>;
    onGoToStep: (step: number) => void;
  }>,
) {
  const values = props.form.getValues();

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Review your listing details before publishing.
      </p>

      {/* Property Details */}
      <Card>
        <SectionHeader
          title="Property Details"
          step={0}
          onEdit={props.onGoToStep}
        />
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <Badge variant="outline">
              {values.listing_type === "sale" ? "For Sale" : "For Rent"}
            </Badge>
            <Badge variant="outline">{values.property_type}</Badge>
            {values.new_build && <Badge variant="secondary">New Build</Badge>}
          </div>
          <p className="text-neutral-700">
            {values.address_line1}
            {values.address_line2 ? `, ${values.address_line2}` : ""}
          </p>
          <p className="text-neutral-500">
            {values.city}
            {values.county ? `, ${values.county}` : ""} {values.postcode}
          </p>
          <div className="flex gap-4 text-neutral-600">
            <span>{values.bedrooms} bed</span>
            <span>{values.bathrooms} bath</span>
            {values.reception_rooms ? (
              <span>{values.reception_rooms} reception</span>
            ) : null}
            {values.square_footage ? (
              <span>{values.square_footage} sq ft</span>
            ) : null}
          </div>
          {values.tenure && (
            <p className="text-neutral-500 capitalize">{values.tenure}</p>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <SectionHeader
          title="Description"
          step={1}
          onEdit={props.onGoToStep}
        />
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium text-neutral-800">{values.title}</p>
          <p className="line-clamp-4 whitespace-pre-wrap text-neutral-600">
            {values.description}
          </p>
          {values.features && values.features.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {values.features.map((f) => (
                <Badge key={f} variant="secondary" className="text-xs">
                  {f}
                </Badge>
              ))}
            </div>
          )}
          {values.epc_rating && (
            <p className="text-neutral-500">
              EPC: {values.epc_rating}
              {values.epc_score ? ` (${values.epc_score})` : ""}
            </p>
          )}
          {values.planning_permission_status && (
            <p className="text-neutral-500">
              Planning permission:{" "}
              {PLANNING_PERMISSION_LABELS[values.planning_permission_status]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <SectionHeader title="Pricing" step={2} onEdit={props.onGoToStep} />
        <CardContent className="space-y-2 text-sm">
          <p className="text-lg font-bold text-neutral-900">
            {formatPrice(values.price)}
            {values.listing_type === "rent" && values.rent_frequency
              ? ` ${values.rent_frequency}`
              : ""}
          </p>
          {values.price_qualifier && (
            <p className="text-neutral-500 capitalize">
              {values.price_qualifier.replace("_", " ")}
            </p>
          )}
          {values.service_charge_annual ? (
            <p className="text-neutral-500">
              Service charge: {formatPrice(values.service_charge_annual)} p/a
            </p>
          ) : null}
          {values.ground_rent_annual ? (
            <p className="text-neutral-500">
              Ground rent: {formatPrice(values.ground_rent_annual)} p/a
            </p>
          ) : null}
          {values.available_from && (
            <p className="text-neutral-500">
              Available from: {values.available_from}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

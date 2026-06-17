"use client";

import { useState, useCallback, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, FileText, Sparkles, ClipboardList } from "lucide-react";
import type { ListingFormValues } from "../ListingForm";

const EPC_RATINGS = ["A", "B", "C", "D", "E", "F", "G"] as const;
const COUNCIL_TAX_BANDS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
const PLANNING_PERMISSION_OPTIONS = [
  { value: "granted", label: "Granted" },
  { value: "pending", label: "Decision pending" },
  { value: "refused", label: "Refused" },
  { value: "none_known", label: "None known" },
] as const;

export function Description(
  props: Readonly<{ form: UseFormReturn<ListingFormValues> }>,
) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = props.form;

  const title = watch("title") ?? "";
  const description = watch("description") ?? "";
  const featuresWatch = watch("features");
  const features = useMemo(() => featuresWatch ?? [], [featuresWatch]);
  const epcRating = watch("epc_rating");

  const [featureInput, setFeatureInput] = useState("");

  const addFeature = useCallback(() => {
    const trimmed = featureInput.trim();
    if (trimmed && !features.includes(trimmed)) {
      setValue("features", [...features, trimmed]);
      setFeatureInput("");
    }
  }, [featureInput, features, setValue]);

  const removeFeature = useCallback(
    (feature: string) => {
      setValue(
        "features",
        features.filter((f) => f !== feature),
      );
    },
    [features, setValue],
  );

  return (
    <div className="space-y-8">
      {/* Listing Copy */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-primary-dark">
          <FileText className="size-4 text-brand-primary" />
          Listing Copy
        </h3>

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">Title</Label>
          <span className="text-xs text-neutral-400">
            {title.length}/200
          </span>
        </div>
        <Input
          id="title"
          maxLength={200}
          placeholder="e.g. Stunning 3-bed Victorian terrace in Islington"
          aria-invalid={!!errors.title}
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-error">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <span className="text-xs text-neutral-400">
            {description.length}/5000
          </span>
        </div>
        <Textarea
          id="description"
          maxLength={5000}
          rows={8}
          placeholder="Describe the property in detail..."
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-error">{errors.description.message}</p>
        )}
      </div>
      </div>

      {/* Features (tag input) */}
      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-primary-dark">
          <Sparkles className="size-4 text-brand-primary" />
          Key Features
        </h3>
        <Label htmlFor="feature-input" className="sr-only">
          Features
        </Label>
        <div className="flex gap-2">
          <Input
            id="feature-input"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature();
              }
            }}
            placeholder="Type a feature and press Enter"
          />
        </div>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {features.map((feature) => (
              <Badge
                key={feature}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(feature)}
                  className="rounded-full p-0.5 hover:bg-neutral-300"
                  aria-label={`Remove ${feature}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Property Information */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-primary-dark">
          <ClipboardList className="size-4 text-brand-primary" />
          Property Information
        </h3>

      {/* EPC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="epc_rating">EPC Rating (optional)</Label>
          <Select
            value={epcRating ?? ""}
            onValueChange={(val) =>
              setValue("epc_rating", val as ListingFormValues["epc_rating"])
            }
          >
            <SelectTrigger id="epc_rating">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {EPC_RATINGS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {epcRating && (
          <div className="space-y-2">
            <Label htmlFor="epc_score">EPC Score (1-100)</Label>
            <Input
              id="epc_score"
              type="number"
              min={1}
              max={100}
              {...register("epc_score", { valueAsNumber: true })}
            />
          </div>
        )}
      </div>

      {/* Council Tax Band */}
      <div className="space-y-2">
        <Label htmlFor="council_tax_band">Council Tax Band (optional)</Label>
        <Select
          value={watch("council_tax_band") ?? ""}
          onValueChange={(val) => setValue("council_tax_band", val)}
        >
          <SelectTrigger id="council_tax_band">
            <SelectValue placeholder="Select band" />
          </SelectTrigger>
          <SelectContent>
            {COUNCIL_TAX_BANDS.map((b) => (
              <SelectItem key={b} value={b}>
                Band {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Planning Permission Status */}
      <div className="space-y-2">
        <Label htmlFor="planning_permission_status">
          Planning permission status
        </Label>
        <Select
          value={watch("planning_permission_status") ?? ""}
          onValueChange={(val) =>
            setValue(
              "planning_permission_status",
              val as ListingFormValues["planning_permission_status"],
              { shouldValidate: true },
            )
          }
        >
          <SelectTrigger
            id="planning_permission_status"
            aria-invalid={!!errors.planning_permission_status}
          >
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {PLANNING_PERMISSION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.planning_permission_status && (
          <p className="text-xs text-error">
            {errors.planning_permission_status.message}
          </p>
        )}
        <p className="text-xs text-neutral-400">
          Required under NTSELAT material information rules.
        </p>
      </div>
      </div>
    </div>
  );
}

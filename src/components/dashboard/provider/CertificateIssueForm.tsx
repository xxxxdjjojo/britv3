"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Certificate } from "@/services/provider/provider-certificate-service";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const CERTIFICATE_TYPES = [
  "gas_safe_cp12",
  "eic",
  "eicr",
  "minor_works",
  "custom",
] as const;

type CertificateTypeValue = (typeof CERTIFICATE_TYPES)[number];

const certificateSchema = z
  .object({
    certificateType: z.enum(CERTIFICATE_TYPES, {
      message: "Certificate type is required",
    }),
    certificateNumber: z.string().optional(),
    issuedAt: z.string().min(1, "Issue date is required"),
    expiresAt: z.string().optional(),
    notes: z.string().max(1000, "Notes must be at most 1000 characters").optional(),
  })
  .superRefine((val, ctx) => {
    // Gas Safe CP12: if certificate number is provided, must be exactly 6 digits
    if (
      val.certificateType === "gas_safe_cp12" &&
      val.certificateNumber &&
      !/^\d{6}$/.test(val.certificateNumber)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Gas Safe certificate number must be exactly 6 digits (e.g. 123456)",
        path: ["certificateNumber"],
      });
    }
  });

type CertificateFormValues = z.infer<typeof certificateSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CERTIFICATE_TYPE_LABELS: Record<CertificateTypeValue, string> = {
  gas_safe_cp12: "Gas Safe CP12",
  eic: "Electrical Installation Certificate (EIC)",
  eicr: "Electrical Installation Condition Report (EICR)",
  minor_works: "Minor Electrical Works Certificate",
  custom: "Custom Certificate",
};

const CERTIFICATE_NUMBER_HINTS: Record<CertificateTypeValue, string> = {
  gas_safe_cp12: "6-digit Gas Safe registration number (e.g. 123456)",
  eic: "Certificate reference number",
  eicr: "Certificate reference number",
  minor_works: "Certificate reference number",
  custom: "Optional reference number",
};

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CertificateIssueFormProps = Readonly<{
  bookingId: string;
  providerId: string;
  onSuccess?: (certificate: Certificate) => void;
}>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CertificateIssueForm({
  bookingId,
  onSuccess,
}: CertificateIssueFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      certificateType: "gas_safe_cp12",
      issuedAt: todayISODate(),
    },
  });

  const selectedType = watch("certificateType");

  async function onSubmit(data: CertificateFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/provider/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          certificateType: data.certificateType,
          certificateNumber: data.certificateNumber || undefined,
          issuedAt: data.issuedAt,
          expiresAt: data.expiresAt || undefined,
          notes: data.notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to issue certificate");
      }

      const certificate = (await res.json()) as Certificate;
      toast.success("Certificate issued successfully");
      reset({ certificateType: "gas_safe_cp12", issuedAt: todayISODate() });
      onSuccess?.(certificate);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to issue certificate");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Certificate Type */}
      <div className="space-y-2">
        <Label htmlFor="certificateType">
          Certificate Type <span className="text-red-500">*</span>
        </Label>
        <select
          id="certificateType"
          className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register("certificateType")}
          aria-invalid={!!errors.certificateType}
        >
          {CERTIFICATE_TYPES.map((type) => (
            <option key={type} value={type}>
              {CERTIFICATE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        {errors.certificateType && (
          <p className="text-xs text-red-500">{errors.certificateType.message}</p>
        )}
      </div>

      {/* Certificate Number */}
      <div className="space-y-2">
        <Label htmlFor="certificateNumber">Certificate Number</Label>
        <Input
          id="certificateNumber"
          placeholder={CERTIFICATE_NUMBER_HINTS[selectedType ?? "custom"]}
          {...register("certificateNumber")}
          aria-invalid={!!errors.certificateNumber}
        />
        {errors.certificateNumber && (
          <p className="text-xs text-red-500">{errors.certificateNumber.message}</p>
        )}
      </div>

      {/* Issue Date + Expiry Date */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="issuedAt">
            Issue Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="issuedAt"
            type="date"
            {...register("issuedAt")}
            aria-invalid={!!errors.issuedAt}
          />
          {errors.issuedAt && (
            <p className="text-xs text-red-500">{errors.issuedAt.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiresAt">Expiry Date</Label>
          <Input
            id="expiresAt"
            type="date"
            {...register("expiresAt")}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any additional notes about this certificate..."
          className="min-h-24 resize-y"
          {...register("notes")}
          aria-invalid={!!errors.notes}
        />
        {errors.notes && (
          <p className="text-xs text-red-500">{errors.notes.message}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-primary text-white hover:bg-brand-primary/90 min-w-40"
        >
          {isSubmitting ? "Issuing..." : "Issue Certificate"}
        </Button>
      </div>
    </form>
  );
}

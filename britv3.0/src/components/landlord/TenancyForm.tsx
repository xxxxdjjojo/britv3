"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { TenancyFormData } from "@/types/landlord";
import { tenancySchema, RENT_FREQUENCIES } from "@/types/landlord";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TenancyFormProps = Readonly<{
  propertyId: string;
  mode: "create" | "edit";
  tenancyId?: string;
  defaultValues?: Partial<TenancyFormData>;
  onSuccess?: () => void;
}>;

export function TenancyForm({
  propertyId,
  mode,
  tenancyId,
  defaultValues,
  onSuccess,
}: TenancyFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<TenancyFormData>({
    resolver: zodResolver(tenancySchema) as any,
    defaultValues: {
      tenant_name: "",
      tenant_email: "",
      tenant_phone: "",
      lease_start_date: "",
      lease_end_date: "",
      rent_amount: undefined,
      rent_frequency: "monthly",
      deposit_amount: undefined,
      deposit_scheme: "",
      notes: "",
      ...defaultValues,
    },
  });

  const rentFrequency = watch("rent_frequency");

  async function onSubmit(data: TenancyFormData) {
    setSubmitting(true);

    try {
      const url =
        mode === "create"
          ? `/api/properties/${propertyId}/tenancies`
          : `/api/tenancies/${tenancyId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Request failed");
      }

      toast.success(
        mode === "create"
          ? "Tenancy created successfully"
          : "Tenancy updated successfully",
      );

      onSuccess?.();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Tenant Name */}
        <div className="space-y-2">
          <Label htmlFor="tenant_name">
            Tenant Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tenant_name"
            placeholder="John Smith"
            {...register("tenant_name")}
            aria-invalid={!!errors.tenant_name}
          />
          {errors.tenant_name && (
            <p className="text-sm text-destructive">{errors.tenant_name.message}</p>
          )}
        </div>

        {/* Tenant Email */}
        <div className="space-y-2">
          <Label htmlFor="tenant_email">Tenant Email</Label>
          <Input
            id="tenant_email"
            type="email"
            placeholder="john@example.com"
            {...register("tenant_email")}
            aria-invalid={!!errors.tenant_email}
          />
          {errors.tenant_email && (
            <p className="text-sm text-destructive">{errors.tenant_email.message}</p>
          )}
        </div>

        {/* Tenant Phone */}
        <div className="space-y-2">
          <Label htmlFor="tenant_phone">Tenant Phone</Label>
          <Input
            id="tenant_phone"
            type="tel"
            placeholder="07700 900000"
            {...register("tenant_phone")}
          />
        </div>

        {/* Lease Start Date */}
        <div className="space-y-2">
          <Label htmlFor="lease_start_date">
            Lease Start Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lease_start_date"
            type="date"
            {...register("lease_start_date")}
            aria-invalid={!!errors.lease_start_date}
          />
          {errors.lease_start_date && (
            <p className="text-sm text-destructive">{errors.lease_start_date.message}</p>
          )}
        </div>

        {/* Lease End Date */}
        <div className="space-y-2">
          <Label htmlFor="lease_end_date">Lease End Date</Label>
          <Input
            id="lease_end_date"
            type="date"
            {...register("lease_end_date")}
          />
        </div>

        {/* Rent Amount */}
        <div className="space-y-2">
          <Label htmlFor="rent_amount">
            Rent Amount <span className="text-destructive">*</span>
          </Label>
          <Input
            id="rent_amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="1200"
            {...register("rent_amount")}
            aria-invalid={!!errors.rent_amount}
          />
          {errors.rent_amount && (
            <p className="text-sm text-destructive">{errors.rent_amount.message}</p>
          )}
        </div>

        {/* Rent Frequency */}
        <div className="space-y-2">
          <Label htmlFor="rent_frequency">Rent Frequency</Label>
          <Select
            value={rentFrequency}
            onValueChange={(val) =>
              setValue("rent_frequency", val as TenancyFormData["rent_frequency"])
            }
          >
            <SelectTrigger id="rent_frequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {RENT_FREQUENCIES.map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deposit Amount */}
        <div className="space-y-2">
          <Label htmlFor="deposit_amount">Deposit Amount</Label>
          <Input
            id="deposit_amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="1200"
            {...register("deposit_amount")}
          />
        </div>

        {/* Deposit Scheme */}
        <div className="space-y-2">
          <Label htmlFor="deposit_scheme">Deposit Scheme</Label>
          <Input
            id="deposit_scheme"
            placeholder="DPS / TDS / MyDeposits"
            {...register("deposit_scheme")}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Additional notes about the tenancy..."
          {...register("notes")}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : mode === "create"
              ? "Create Tenancy"
              : "Update Tenancy"}
        </Button>
      </div>
    </form>
  );
}

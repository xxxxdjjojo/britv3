/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  financialEntrySchema,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "@/types/landlord";
import type { FinancialEntryFormData, Tenancy } from "@/types/landlord";
import { validateFileType } from "@/lib/file-validation";
import { compressReceipt } from "@/lib/image-compression";
import { createClient } from "@/lib/supabase/client";

type ReceiptPreview = Readonly<{
  file: File;
  previewUrl: string | null;
  name: string;
}>;

/**
 * Unified form for logging income AND expense entries.
 * Income shows income categories; expense shows expense categories.
 * For rent income, shows tenancy selection and rent period dates.
 * Supports optional receipt upload (PDF/JPG/PNG, max 2MB).
 */
export function FinancialEntryForm(
  props: Readonly<{
    propertyId: string;
    tenancies?: Tenancy[];
  }>,
) {
  const [receipt, setReceipt] = useState<ReceiptPreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeType, setActiveType] = useState<"income" | "expense">("income");
  const [selectedTenancy, setSelectedTenancy] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FinancialEntryFormData>({
    resolver: zodResolver(financialEntrySchema) as never,
    defaultValues: {
      type: "income",
      category: "",
      amount: undefined as unknown as number,
      entry_date: new Date().toISOString().slice(0, 10),
      description: "",
      rent_period_start: "",
      rent_period_end: "",
    },
  });

  const category = watch("category");

  // Sync type field when toggling tabs
  useEffect(() => {
    setValue("type", activeType);
    setValue("category", "");
  }, [activeType, setValue]);

  const categories = activeType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const showRentFields = activeType === "income" && category === "rent";

  async function handleReceiptSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB max)
    if (file.size > 2_097_152) {
      toast.error("Receipt must be 2MB or smaller");
      e.target.value = "";
      return;
    }

    // Validate file type
    const validation = await validateFileType(file);
    if (!validation.valid) {
      toast.error("Only PDF, JPEG, and PNG files are allowed");
      e.target.value = "";
      return;
    }

    try {
      const compressed = await compressReceipt(file);
      const previewUrl = compressed.type.startsWith("image/")
        ? URL.createObjectURL(compressed)
        : null;
      setReceipt({ file: compressed, previewUrl, name: file.name });
    } catch {
      toast.error("Failed to process receipt");
    }

    e.target.value = "";
  }

  function removeReceipt() {
    if (receipt?.previewUrl) {
      URL.revokeObjectURL(receipt.previewUrl);
    }
    setReceipt(null);
  }

  async function onSubmit(data: FinancialEntryFormData) {
    setIsSubmitting(true);

    try {
      // 1. Create financial entry via API
      const body: Record<string, unknown> = { ...data };
      if (showRentFields && selectedTenancy) {
        body.tenancy_id = selectedTenancy;
      }

      const res = await fetch(
        `/api/properties/${props.propertyId}/financials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create entry");
      }

      const record = await res.json();

      // 2. Upload receipt to Supabase Storage if present
      if (receipt) {
        const supabase = createClient();
        const filePath = `${props.propertyId}/${record.id}/${Date.now()}-${receipt.name}`;

        const { error: uploadError } = await supabase.storage
          .from("expense-receipts")
          .upload(filePath, receipt.file, {
            contentType: receipt.file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Receipt upload failed:", uploadError);
          toast.error("Entry created but receipt upload failed");
        } else {
          // Update receipt_url on the entry
          const {
            data: { publicUrl },
          } = supabase.storage.from("expense-receipts").getPublicUrl(filePath);

          await supabase
            .from("financial_entries")
            .update({ receipt_url: publicUrl })
            .eq("id", record.id);
        }
      }

      toast.success(
        `${activeType === "income" ? "Income" : "Expense"} entry logged`,
      );

      // Reset form
      reset();
      setReceipt(null);
      setSelectedTenancy("");

      // Refresh page to show new entry
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Type toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => setActiveType("income")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeType === "income"
              ? "bg-white text-green-700 shadow-sm dark:bg-gray-800 dark:text-green-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => setActiveType("expense")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeType === "expense"
              ? "bg-white text-red-700 shadow-sm dark:bg-gray-800 dark:text-red-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Expense
        </button>
      </div>

      {/* Hidden type field */}
      <input type="hidden" {...register("type")} />

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Category
        </label>
        <select
          id="category"
          {...register("category")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Select category...</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c
                .split("_")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Rent-specific: tenancy selection */}
      {showRentFields && props.tenancies && props.tenancies.length > 0 && (
        <div>
          <label
            htmlFor="tenancy"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Tenancy
          </label>
          <select
            id="tenancy"
            value={selectedTenancy}
            onChange={(e) => setSelectedTenancy(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Select tenancy...</option>
            {props.tenancies
              .filter((t) => t.status === "active" || t.status === "ending_soon")
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tenant_name} ({t.rent_frequency})
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Rent period dates */}
      {showRentFields && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="rent_period_start"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Period Start
            </label>
            <input
              id="rent_period_start"
              type="date"
              {...register("rent_period_start")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label
              htmlFor="rent_period_end"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Period End
            </label>
            <input
              id="rent_period_end"
              type="date"
              {...register("rent_period_end")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      )}

      {/* Amount */}
      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Amount (GBP)
        </label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          {...register("amount")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        {errors.amount && (
          <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label
          htmlFor="entry_date"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Date
        </label>
        <input
          id="entry_date"
          type="date"
          {...register("entry_date")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        {errors.entry_date && (
          <p className="mt-1 text-xs text-red-600">
            {errors.entry_date.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          rows={2}
          {...register("description")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      {/* Receipt upload (for expenses primarily, but allowed for any entry) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Receipt (optional, PDF/JPG/PNG, max 2MB)
        </label>
        {receipt ? (
          <div className="mt-2 flex items-center gap-3 rounded-md border p-3 dark:border-gray-600">
            {receipt.previewUrl ? (
              <img
                src={receipt.previewUrl}
                alt="Receipt preview"
                className="h-16 w-16 rounded border object-cover dark:border-gray-600"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded border bg-surface text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-800">
                PDF
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{receipt.name}</p>
            </div>
            <button
              type="button"
              onClick={removeReceipt}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="mt-2 flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 transition-colors hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500">
            Click to upload receipt
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleReceiptSelect}
            />
          </label>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : `Log ${activeType === "income" ? "Income" : "Expense"}`}
        </button>
      </div>
    </form>
  );
}

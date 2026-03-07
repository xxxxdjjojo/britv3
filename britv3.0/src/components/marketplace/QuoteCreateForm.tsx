"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  quoteCreateSchema,
  type QuoteCreateInput,
} from "@/lib/validators/marketplace-schemas";
import { cn } from "@/lib/utils";

type QuoteCreateFormProps = Readonly<{
  serviceRequestId: string;
  className?: string;
  onSuccess?: () => void;
}>;

export function QuoteCreateForm({
  serviceRequestId,
  className,
  onSuccess,
}: QuoteCreateFormProps) {
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(quoteCreateSchema),
    defaultValues: {
      line_items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }],
      scope_of_work: "",
      vat_included: false,
      validity_date: "" as unknown as Date,
      estimated_duration: "",
      payment_terms: "",
      warranty_info: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "line_items",
  });

  const lineItems = watch("line_items") as QuoteCreateInput["line_items"];
  const vatIncluded = watch("vat_included") as boolean;

  const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const vatAmount = vatIncluded ? subtotal * 0.2 : 0;
  const grandTotal = subtotal + vatAmount;

  const updateLineTotal = (index: number) => {
    const qty = lineItems[index]?.quantity ?? 0;
    const price = lineItems[index]?.unit_price ?? 0;
    setValue(`line_items.${index}.total`, qty * price);
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    setSubmitState("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/quotes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(data as object), service_request_id: serviceRequestId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to submit quote");
      }
      setSubmitState("success");
      onSuccess?.();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong",
      );
      setSubmitState("error");
    }
  };

  if (submitState === "success") {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-6 text-center", className)}>
        <h3 className="text-lg font-semibold text-foreground">Quote Submitted</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The customer will be notified of your quote.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-5 rounded-lg border border-border bg-card p-6", className)}
    >
      <h2 className="text-lg font-semibold text-foreground">Submit Quote</h2>

      {/* Line Items */}
      <div className="space-y-3">
        <Label>Line items</Label>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_80px_100px_100px_40px] items-end gap-2"
          >
            <div className="space-y-1">
              {index === 0 && (
                <span className="text-xs text-muted-foreground">Description</span>
              )}
              <Input
                placeholder="Item description"
                {...register(`line_items.${index}.description`)}
              />
            </div>
            <div className="space-y-1">
              {index === 0 && (
                <span className="text-xs text-muted-foreground">Qty</span>
              )}
              <Input
                type="number"
                min={1}
                {...register(`line_items.${index}.quantity`, {
                  valueAsNumber: true,
                  onChange: () => updateLineTotal(index),
                })}
              />
            </div>
            <div className="space-y-1">
              {index === 0 && (
                <span className="text-xs text-muted-foreground">Unit price</span>
              )}
              <Input
                type="number"
                min={0}
                step="0.01"
                {...register(`line_items.${index}.unit_price`, {
                  valueAsNumber: true,
                  onChange: () => updateLineTotal(index),
                })}
              />
            </div>
            <div className="space-y-1">
              {index === 0 && (
                <span className="text-xs text-muted-foreground">Total</span>
              )}
              <Input
                type="number"
                readOnly
                value={(lineItems[index]?.total ?? 0).toFixed(2)}
                className="bg-muted/50"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => fields.length > 1 && remove(index)}
              disabled={fields.length <= 1}
              aria-label="Remove line item"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        {errors.line_items && (
          <p className="text-xs text-destructive">
            {typeof errors.line_items.message === "string"
              ? errors.line_items.message
              : "Check line items"}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({ description: "", quantity: 1, unit_price: 0, total: 0 })
          }
        >
          <Plus /> Add line item
        </Button>
      </div>

      {/* Scope of Work */}
      <div className="space-y-1.5">
        <Label htmlFor="quote-scope">Scope of work</Label>
        <Textarea
          id="quote-scope"
          rows={4}
          placeholder="Describe the scope of work..."
          {...register("scope_of_work")}
        />
        {errors.scope_of_work && (
          <p className="text-xs text-destructive">{errors.scope_of_work.message}</p>
        )}
      </div>

      {/* Duration & Terms */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="quote-duration">Estimated duration</Label>
          <Input
            id="quote-duration"
            placeholder="e.g. 2-3 days"
            {...register("estimated_duration")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quote-validity">Valid until</Label>
          <Input
            id="quote-validity"
            type="date"
            {...register("validity_date")}
          />
          {errors.validity_date && (
            <p className="text-xs text-destructive">{errors.validity_date.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="quote-payment">Payment terms</Label>
          <Input
            id="quote-payment"
            placeholder="e.g. 50% upfront, 50% on completion"
            {...register("payment_terms")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quote-warranty">Warranty</Label>
          <Input
            id="quote-warranty"
            placeholder="e.g. 12 months parts & labour"
            {...register("warranty_info")}
          />
        </div>
      </div>

      {/* VAT Toggle */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          {...register("vat_included")}
          className="accent-brand-primary"
        />
        <span>VAT included (20%)</span>
      </label>

      {/* Totals */}
      <div className="rounded-md bg-muted/50 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">
            {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(subtotal)}
          </span>
        </div>
        {vatIncluded && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT (20%)</span>
            <span className="font-medium">
              {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(vatAmount)}
            </span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t pt-1">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">
            {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(grandTotal)}
          </span>
        </div>
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      <Button
        type="submit"
        disabled={submitState === "submitting"}
        className="w-full"
        size="lg"
      >
        {submitState === "submitting" ? (
          <>
            <Loader2 className="animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Quote"
        )}
      </Button>
    </form>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles, X } from "lucide-react";
import { QuotePreview } from "./QuotePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LineItemRow = {
  description: string;
  qty: number;
  unitPrice: number;
  vatRate: 0 | 5 | 20;
};

type QuoteFormValues = {
  clientName: string;
  jobTitle: string;
  category: string;
  lineItems: LineItemRow[];
  notes: string;
  validUntil: string;
};

type LineItemSuggestion = {
  description: string;
  quantity: number;
  unit_price_gbp: number;
  vat_rate: 0 | 5 | 20;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function calcLinePence(qty: number, unitPrice: number): number {
  return Math.round((Number(qty) || 0) * Math.round((Number(unitPrice) || 0) * 100));
}

function fmtGbp(pence: number): string {
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type QuoteBuilderFormProps = Readonly<{
  providerId: string;
  providerName: string;
  requestId?: string;
  prefillClientName?: string;
  prefillJobTitle?: string;
  prefillCategory?: string;
}>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuoteBuilderForm({
  providerId,
  providerName,
  requestId,
  prefillClientName,
  prefillJobTitle,
  prefillCategory,
}: QuoteBuilderFormProps) {
  const DRAFT_KEY = `quote_draft_${providerId}`;

  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const defaultValues: QuoteFormValues = {
    clientName: prefillClientName ?? "",
    jobTitle: prefillJobTitle ?? "",
    category: prefillCategory ?? "",
    lineItems: [{ description: "", qty: 1, unitPrice: 0, vatRate: 20 }],
    notes: "",
    validUntil: defaultValidUntil(),
  };

  const form = useForm<QuoteFormValues>({ defaultValues });
  const { register, control, handleSubmit, setValue, reset, formState } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedValues = useWatch({ control });
  const watchedItems = (watchedValues.lineItems ?? []) as LineItemRow[];
  const watchedJobTitle = (watchedValues.jobTitle ?? "") as string;
  const watchedCategory = (watchedValues.category ?? "") as string;
  const watchedClientName = (watchedValues.clientName ?? "") as string;
  const watchedNotes = (watchedValues.notes ?? "") as string;
  const watchedValidUntil = (watchedValues.validUntil ?? "") as string;

  // Computed totals
  const subtotalPence = watchedItems.reduce(
    (s, item) => s + calcLinePence(item.qty, item.unitPrice),
    0,
  );
  const vatPence = watchedItems.reduce((s, item) => {
    const linePence = calcLinePence(item.qty, item.unitPrice);
    return s + Math.round(linePence * (Number(item.vatRate) / 100));
  }, 0);
  const totalPence = subtotalPence + vatPence;

  // ---- localStorage restore on mount ----------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) {
        setShowRestoreBanner(true);
      }
    } catch {
      // ignore
    }
  }, [DRAFT_KEY]);

  // ---- Auto-save every 30s --------------------------------------------------
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify(form.getValues()),
        );
      } catch {
        // ignore
      }
    }, 30_000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [DRAFT_KEY, form]);

  // ---- Handlers ---------------------------------------------------------------

  function handleRestore() {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<QuoteFormValues>;
        reset({ ...defaultValues, ...parsed });
      }
    } catch {
      toast.error("Could not restore saved draft.");
    }
    setShowRestoreBanner(false);
  }

  function handleDismissRestore() {
    setShowRestoreBanner(false);
  }

  async function handleSuggestItems() {
    if (!watchedJobTitle.trim()) return;
    setSuggestLoading(true);
    try {
      const res = await fetch("/api/provider/quotes/suggest-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: watchedJobTitle,
          category: watchedCategory || undefined,
        }),
      });
      if (!res.ok) throw new Error("Non-ok response");
      const data = (await res.json()) as { items?: LineItemSuggestion[] };
      const items = data.items ?? [];
      if (items.length === 0) {
        toast.info("No suggestions returned.");
        return;
      }
      items.forEach((item) => {
        append({
          description: item.description,
          qty: item.quantity,
          unitPrice: item.unit_price_gbp,
          vatRate: item.vat_rate,
        });
      });
      toast.success(`Added ${items.length} suggested line items.`);
    } catch {
      toast.error("Couldn't generate suggestions");
    } finally {
      setSuggestLoading(false);
    }
  }

  async function submitQuote(values: QuoteFormValues, mode: "draft" | "send") {
    setSubmitting(true);
    try {
      const lineItems = values.lineItems.map((item) => ({
        name: item.description || "Item",
        quantity: Number(item.qty),
        unit_price_pence: Math.round((Number(item.unitPrice) || 0) * 100),
        total_pence: calcLinePence(item.qty, item.unitPrice),
      }));

      const today = new Date();
      const validUntilDate = values.validUntil
        ? new Date(values.validUntil)
        : new Date(today.getTime() + 14 * 86_400_000);
      const diffMs = validUntilDate.getTime() - today.getTime();
      const validUntilDays = Math.max(
        1,
        Math.round(diffMs / 86_400_000),
      );

      // 1. Create quote (draft)
      const createRes = await fetch("/api/provider/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId ?? undefined,
          line_items: lineItems,
          notes: values.notes || undefined,
          valid_until_days: validUntilDays,
        }),
      });

      if (!createRes.ok) {
        const err = (await createRes.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to save quote");
      }

      const quote = (await createRes.json()) as { id: string };

      // 2. If sending, transition to sent
      if (mode === "send") {
        const sendRes = await fetch(`/api/provider/quotes/${quote.id}/send`, {
          method: "POST",
        });
        if (!sendRes.ok) {
          const err = (await sendRes.json()) as { error?: string };
          throw new Error(err.error ?? "Failed to send quote");
        }
        // Clear localStorage on successful send
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {
          // ignore
        }
        toast.success("Quote sent to client.");
      } else {
        toast.success("Quote saved as draft.");
      }

      // Clear localStorage for draft too since it is now persisted
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ------------------------------------------------------------------ */}
      {/* Left pane — Form                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-6">
        {/* Restore banner */}
        {showRestoreBanner && (
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950">
            <span className="text-amber-800 dark:text-amber-200">
              You have an unsaved draft. Restore it?
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleRestore}>
                Restore
              </Button>
              <button
                type="button"
                onClick={handleDismissRestore}
                aria-label="Dismiss"
                className="text-amber-600 hover:text-amber-800 dark:text-amber-400"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Client / Job section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client &amp; Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="clientName"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Client Name
                </label>
                {requestId && prefillClientName ? (
                  <Input
                    id="clientName"
                    value={prefillClientName}
                    readOnly
                    className="bg-muted"
                  />
                ) : (
                  <Input
                    id="clientName"
                    placeholder="e.g. Jane Smith"
                    {...register("clientName")}
                  />
                )}
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Category
                </label>
                {requestId && prefillCategory ? (
                  <Input
                    id="category"
                    value={prefillCategory}
                    readOnly
                    className="bg-muted capitalize"
                  />
                ) : (
                  <Input
                    id="category"
                    placeholder="e.g. Plumbing"
                    {...register("category")}
                  />
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="jobTitle"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Job Title
              </label>
              {requestId && prefillJobTitle ? (
                <Input
                  id="jobTitle"
                  value={prefillJobTitle}
                  readOnly
                  className="bg-muted"
                />
              ) : (
                <Input
                  id="jobTitle"
                  placeholder="e.g. Boiler replacement and system flush"
                  {...register("jobTitle")}
                />
              )}
            </div>

            {/* AI suggest button */}
            {watchedJobTitle.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSuggestItems}
                disabled={suggestLoading}
                className="gap-2"
              >
                <Sparkles className="size-4 text-primary" />
                {suggestLoading ? "Generating…" : "Suggest line items"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Line items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Column headers */}
            <div className="hidden grid-cols-[1fr_56px_88px_72px_80px_32px] gap-2 text-xs font-medium text-muted-foreground sm:grid">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">VAT %</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            {fields.map((field, index) => {
              const qty = Number(watchedItems[index]?.qty) || 0;
              const unitPrice = Number(watchedItems[index]?.unitPrice) || 0;
              const vatRate = Number(watchedItems[index]?.vatRate) || 0;
              const linePence = calcLinePence(qty, unitPrice);

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_56px_88px_72px_80px_32px] sm:items-center"
                >
                  <Input
                    placeholder="Description"
                    {...register(`lineItems.${index}.description`)}
                  />
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Qty"
                    className="text-right"
                    {...register(`lineItems.${index}.qty`, {
                      valueAsNumber: true,
                    })}
                  />
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">
                      £
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="pl-7 text-right"
                      {...register(`lineItems.${index}.unitPrice`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <Select
                    defaultValue={String(field.vatRate)}
                    onValueChange={(val) =>
                      setValue(
                        `lineItems.${index}.vatRate`,
                        Number(val) as 0 | 5 | 20,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-right text-sm font-medium text-foreground sm:pr-1">
                    {fmtGbp(linePence)}
                    <span className="ml-0.5 text-[10px] text-muted-foreground">
                      +{vatRate}%
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length <= 1}
                    aria-label="Remove line item"
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ description: "", qty: 1, unitPrice: 0, vatRate: 20 })
              }
              className="gap-2"
            >
              <Plus className="size-4" />
              Add Row
            </Button>

            {/* Totals summary */}
            <dl className="ml-auto w-44 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{fmtGbp(subtotalPence)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">VAT</dt>
                <dd className="font-medium">{fmtGbp(vatPence)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-1">
                <dt className="font-bold text-foreground">Total</dt>
                <dd className="font-bold text-foreground">
                  {fmtGbp(totalPence)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Notes + valid until */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="notes"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Notes
              </label>
              <Textarea
                id="notes"
                placeholder="Payment terms, scope exclusions, warranty info…"
                rows={4}
                {...register("notes")}
              />
            </div>
            <div>
              <label
                htmlFor="validUntil"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Valid Until
              </label>
              <Input
                id="validUntil"
                type="date"
                {...register("validUntil")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={submitting || formState.isSubmitting}
            onClick={handleSubmit((values) => submitQuote(values, "draft"))}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            disabled={submitting || formState.isSubmitting}
            onClick={handleSubmit((values) => submitQuote(values, "send"))}
          >
            Send to Client
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right pane — Preview                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Live Preview
        </p>
        <QuotePreview
          providerName={providerName}
          clientName={watchedClientName}
          jobTitle={watchedJobTitle}
          lineItems={watchedItems}
          notes={watchedNotes}
          validUntil={watchedValidUntil}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles, X, Save, FolderOpen, AlignLeft } from "lucide-react";
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
  isSectionHeader?: boolean;
  sectionTitle?: string;
};

type MilestoneRow = {
  label: string;
  amountPence: number;
};

type QuoteFormValues = {
  clientName: string;
  jobTitle: string;
  category: string;
  lineItems: LineItemRow[];
  notes: string;
  validUntil: string;
  stagedPaymentsEnabled: boolean;
  milestones: MilestoneRow[];
};

type LineItemSuggestion = {
  description: string;
  quantity: number;
  unit_price_gbp: number;
  vat_rate: 0 | 5 | 20;
};

type QuoteTemplate = {
  name: string;
  items: LineItemRow[];
};

const TEMPLATES_KEY = "britestate-quote-templates";

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

function loadTemplates(): QuoteTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QuoteTemplate[];
  } catch {
    return [];
  }
}

function saveTemplates(templates: QuoteTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // ignore
  }
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
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const defaultValues: QuoteFormValues = {
    clientName: prefillClientName ?? "",
    jobTitle: prefillJobTitle ?? "",
    category: prefillCategory ?? "",
    lineItems: [{ description: "", qty: 1, unitPrice: 0, vatRate: 20 }],
    notes: "",
    validUntil: defaultValidUntil(),
    stagedPaymentsEnabled: false,
    milestones: [],
  };

  const form = useForm<QuoteFormValues>({ defaultValues });
  const { register, control, handleSubmit, setValue, reset, formState, watch } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const {
    fields: milestoneFields,
    append: appendMilestone,
    remove: removeMilestone,
  } = useFieldArray({
    control,
    name: "milestones",
  });

  const watchedValues = useWatch({ control });
  const watchedItems = (watchedValues.lineItems ?? []) as LineItemRow[];
  const watchedJobTitle = (watchedValues.jobTitle ?? "") as string;
  const watchedCategory = (watchedValues.category ?? "") as string;
  const watchedClientName = (watchedValues.clientName ?? "") as string;
  const watchedNotes = (watchedValues.notes ?? "") as string;
  const watchedValidUntil = (watchedValues.validUntil ?? "") as string;
  const stagedPaymentsEnabled = watch("stagedPaymentsEnabled");
  const watchedMilestones = (watchedValues.milestones ?? []) as MilestoneRow[];

  // Computed totals (skip section headers in calculation)
  const subtotalPence = watchedItems.reduce((s, item) => {
    if (item.isSectionHeader) return s;
    return s + calcLinePence(item.qty, item.unitPrice);
  }, 0);
  const vatPence = watchedItems.reduce((s, item) => {
    if (item.isSectionHeader) return s;
    const linePence = calcLinePence(item.qty, item.unitPrice);
    return s + Math.round(linePence * (Number(item.vatRate) / 100));
  }, 0);
  const totalPence = subtotalPence + vatPence;

  // Milestone allocation validation
  const milestoneTotalPence = watchedMilestones.reduce(
    (s, m) => s + (Math.round((Number(m.amountPence) || 0) * 100)),
    0,
  );
  const milestoneRemainingPence = totalPence - milestoneTotalPence;
  const milestonesValid = Math.abs(milestoneRemainingPence) <= 1; // within £0.01

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
    setTemplates(loadTemplates());
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

  function handleAddSectionHeader() {
    append({
      description: "",
      qty: 1,
      unitPrice: 0,
      vatRate: 0,
      isSectionHeader: true,
      sectionTitle: "New Section",
    });
  }

  function handleSaveTemplateClick() {
    setTemplateName("");
    setShowSaveTemplate(true);
  }

  function handleConfirmSaveTemplate() {
    const name = templateName.trim();
    if (!name) {
      toast.error("Please enter a template name.");
      return;
    }
    const currentItems = form.getValues("lineItems");
    const updated = [...templates, { name, items: currentItems }];
    saveTemplates(updated);
    setTemplates(updated);
    setShowSaveTemplate(false);
    setTemplateName("");
    toast.success(`Template "${name}" saved.`);
  }

  function handleLoadTemplate(tpl: QuoteTemplate) {
    setValue("lineItems", tpl.items);
    setShowLoadTemplate(false);
    toast.success(`Template "${tpl.name}" loaded.`);
  }

  function handleDeleteTemplate(idx: number) {
    const updated = templates.filter((_, i) => i !== idx);
    saveTemplates(updated);
    setTemplates(updated);
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
    // Validate staged payments if enabled
    if (values.stagedPaymentsEnabled && values.milestones.length > 0 && !milestonesValid) {
      toast.error("Milestone amounts must sum to the quote total before sending.");
      return;
    }

    setSubmitting(true);
    try {
      // Filter out section header rows for the API payload
      const lineItems = values.lineItems
        .filter((item) => !item.isSectionHeader)
        .map((item) => ({
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

      // Build milestones payload
      const milestonesPayload =
        values.stagedPaymentsEnabled && values.milestones.length > 0
          ? values.milestones.map((m) => ({
              label: m.label,
              amount_pence: Math.round((Number(m.amountPence) || 0) * 100),
            }))
          : undefined;

      // 1. Create quote (draft)
      const createRes = await fetch("/api/provider/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId ?? undefined,
          line_items: lineItems,
          notes: values.notes || undefined,
          valid_until_days: validUntilDays,
          milestones: milestonesPayload,
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
          <div className="flex items-center justify-between rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm">
            <span className="text-warning">
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
                className="text-warning/70 hover:text-warning"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Client / Job section */}
        <Card className="rounded-xl border border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Step 1
            </p>
            <CardTitle className="font-heading text-lg font-bold tracking-tight text-brand-primary-dark">
              Client &amp; Job
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
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
        <Card className="rounded-xl border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                Step 2
              </p>
              <CardTitle className="font-heading text-lg font-bold tracking-tight text-brand-primary-dark">
                Line Items
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {/* Template actions */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSaveTemplateClick}
                className="gap-1.5 text-xs"
                title="Save current items as a template"
              >
                <Save className="size-3.5" />
                Save template
              </Button>
              {templates.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLoadTemplate((v) => !v)}
                  className="gap-1.5 text-xs"
                  title="Load a saved template"
                >
                  <FolderOpen className="size-3.5" />
                  Load template
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {/* Save template inline dialog */}
            {showSaveTemplate && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <Input
                  autoFocus
                  placeholder="Template name…"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmSaveTemplate();
                    if (e.key === "Escape") setShowSaveTemplate(false);
                  }}
                  className="h-8 text-sm"
                />
                <Button size="sm" onClick={handleConfirmSaveTemplate}>Save</Button>
                <button
                  type="button"
                  onClick={() => setShowSaveTemplate(false)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Cancel"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* Load template list */}
            {showLoadTemplate && templates.length > 0 && (
              <div className="rounded-lg border border-border bg-background shadow-sm">
                <p className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Saved Templates
                </p>
                <ul className="max-h-48 overflow-y-auto">
                  {templates.map((tpl, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 hover:bg-muted/50"
                    >
                      <button
                        type="button"
                        onClick={() => handleLoadTemplate(tpl)}
                        className="flex-1 text-left text-sm font-medium hover:text-primary"
                      >
                        {tpl.name}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ({tpl.items.filter((i) => !i.isSectionHeader).length} items)
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(idx)}
                        aria-label="Delete template"
                        className="ml-2 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Column headers */}
            <div className="hidden grid-cols-[1fr_56px_88px_72px_80px_32px] gap-2 sm:grid">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">Description</span>
              <span className="text-right text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">Qty</span>
              <span className="text-right text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">Unit Price</span>
              <span className="text-right text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">VAT %</span>
              <span className="text-right text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">Total</span>
              <span />
            </div>

            {fields.map((field, index) => {
              const isSectionHeader = field.isSectionHeader === true;

              if (isSectionHeader) {
                return (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 border-b border-border pb-1 pt-2"
                  >
                    <AlignLeft className="size-4 shrink-0 text-muted-foreground" />
                    <Input
                      placeholder="Section title…"
                      {...register(`lineItems.${index}.sectionTitle`)}
                      className="h-8 flex-1 border-0 bg-transparent p-0 text-sm font-semibold focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label="Remove section"
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                );
              }

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

            <div className="flex items-center gap-2">
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddSectionHeader}
                className="gap-2 text-muted-foreground"
              >
                <AlignLeft className="size-4" />
                Add Section
              </Button>
            </div>

            {/* Totals summary */}
            <div className="mt-2 rounded-xl border border-border bg-surface p-4">
              <dl className="ml-auto w-full max-w-[220px] space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium text-foreground">{fmtGbp(subtotalPence)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">VAT</dt>
                  <dd className="font-medium text-foreground">{fmtGbp(vatPence)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="font-bold text-brand-primary-dark">Total</dt>
                  <dd className="font-bold text-brand-primary-dark text-base">
                    {fmtGbp(totalPence)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Staged Payments Toggle                                           */}
            {/* ---------------------------------------------------------------- */}
            <div className="border-t border-border pt-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  {...register("stagedPaymentsEnabled")}
                  className="size-4 rounded border-border accent-primary"
                />
                <span className="text-sm font-medium text-foreground">
                  Enable staged payments
                </span>
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Split the total into payment milestones that the client pays over time.
              </p>
            </div>

            {stagedPaymentsEnabled && (
              <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                  Payment Milestones
                </p>

                {milestoneFields.map((mField, mIdx) => (
                  <div key={mField.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Milestone label (e.g. Deposit)"
                      {...register(`milestones.${mIdx}.label`)}
                      className="flex-1"
                    />
                    <div className="relative w-32">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">
                        £
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        className="pl-7 text-right"
                        {...register(`milestones.${mIdx}.amountPence`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMilestone(mIdx)}
                      aria-label="Remove milestone"
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendMilestone({ label: "", amountPence: 0 })}
                  className="gap-2"
                >
                  <Plus className="size-4" />
                  Add Milestone
                </Button>

                {/* Allocation indicator */}
                {milestoneFields.length > 0 && (
                  <div
                    className={`mt-2 rounded-lg px-3 py-2 text-sm ${
                      milestonesValid
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {milestonesValid ? (
                      <span>Milestones fully allocated — {fmtGbp(totalPence)}</span>
                    ) : (
                      <span>
                        {milestoneRemainingPence > 0
                          ? `${fmtGbp(milestoneRemainingPence)} remaining to allocate`
                          : `Over-allocated by ${fmtGbp(Math.abs(milestoneRemainingPence))}`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes + valid until */}
        <Card className="rounded-xl border border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Step 3
            </p>
            <CardTitle className="font-heading text-lg font-bold tracking-tight text-brand-primary-dark">
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
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
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={submitting || formState.isSubmitting}
            onClick={handleSubmit((values) => submitQuote(values, "draft"))}
            className="rounded-xl border-border px-6"
          >
            Save Draft
          </Button>
          <Button
            type="button"
            disabled={submitting || formState.isSubmitting}
            onClick={handleSubmit((values) => submitQuote(values, "send"))}
            className="rounded-xl bg-brand-gold px-6 text-brand-gold-foreground hover:bg-brand-gold/90"
          >
            Send to Client
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right pane — Preview                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
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

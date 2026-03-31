"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles, X, Save, FolderOpen, AlignLeft } from "lucide-react";
import { QuotePreview } from "./QuotePreview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
// Section step badge
// ---------------------------------------------------------------------------

function StepBadge({ step }: Readonly<{ step: string }>) {
  return (
    <span className="w-8 h-8 rounded-full bg-[#9ed1bd] flex items-center justify-center text-[#003629] font-bold text-xs shrink-0">
      {step}
    </span>
  );
}

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
    (s, m) => s + Math.round((Number(m.amountPence) || 0) * 100),
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
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form.getValues()));
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
    if (
      values.stagedPaymentsEnabled &&
      values.milestones.length > 0 &&
      !milestonesValid
    ) {
      toast.error("Milestone amounts must sum to the quote total before sending.");
      return;
    }

    setSubmitting(true);
    try {
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
      const validUntilDays = Math.max(1, Math.round(diffMs / 86_400_000));

      const milestonesPayload =
        values.stagedPaymentsEnabled && values.milestones.length > 0
          ? values.milestones.map((m) => ({
              label: m.label,
              amount_pence: Math.round((Number(m.amountPence) || 0) * 100),
            }))
          : undefined;

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

      if (mode === "send") {
        const sendRes = await fetch(`/api/provider/quotes/${quote.id}/send`, {
          method: "POST",
        });
        if (!sendRes.ok) {
          const err = (await sendRes.json()) as { error?: string };
          throw new Error(err.error ?? "Failed to send quote");
        }
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {
          // ignore
        }
        toast.success("Quote sent to client.");
      } else {
        toast.success("Quote saved as draft.");
      }

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

  // Stitch label style
  const labelCls =
    "text-[11px] font-bold tracking-widest text-stone-400 uppercase block mb-1.5";
  // Stitch input style (borderless, tonal background)
  const inputCls =
    "w-full bg-[#f4f3f2] border-0 rounded-lg py-3 px-4 text-sm text-stone-900 focus:ring-1 focus:ring-[#003629] focus:bg-white transition-all placeholder:text-stone-400";

  return (
    <div className="flex flex-col lg:flex-row gap-10">
      {/* ------------------------------------------------------------------ */}
      {/* Left pane — Form                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 space-y-10">
        {/* Restore banner */}
        {showRestoreBanner && (
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <span className="text-amber-800">
              You have an unsaved draft. Restore it?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestore}
                className="rounded-md border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={handleDismissRestore}
                aria-label="Dismiss"
                className="text-amber-600 hover:text-amber-800"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Section 01: Client & Property ── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <StepBadge step="01" />
            <h2 className="text-lg font-semibold font-heading text-stone-900">
              Client &amp; Property
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="clientName" className={labelCls}>
                Client Name
              </label>
              {requestId && prefillClientName ? (
                <input
                  id="clientName"
                  value={prefillClientName}
                  readOnly
                  className={`${inputCls} bg-stone-200/60 cursor-not-allowed`}
                />
              ) : (
                <input
                  id="clientName"
                  placeholder="e.g. Jane Smith"
                  className={inputCls}
                  {...register("clientName")}
                />
              )}
            </div>
            <div>
              <label htmlFor="propertyAddress" className={labelCls}>
                Property Address
              </label>
              {requestId && prefillCategory ? (
                <input
                  id="propertyAddress"
                  value={prefillCategory}
                  readOnly
                  className={`${inputCls} bg-stone-200/60 cursor-not-allowed capitalize`}
                />
              ) : (
                <input
                  id="propertyAddress"
                  placeholder="e.g. 42 Belgravia Square, London"
                  className={inputCls}
                  {...register("category")}
                />
              )}
            </div>
          </div>
        </section>

        {/* ── Section 02: Scope of Work ── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <StepBadge step="02" />
            <h2 className="text-lg font-semibold font-heading text-stone-900">
              Scope of Work
            </h2>
          </div>
          <div>
            <label htmlFor="jobTitle" className={labelCls}>
              Job Title
            </label>
            {requestId && prefillJobTitle ? (
              <input
                id="jobTitle"
                value={prefillJobTitle}
                readOnly
                className={`${inputCls} bg-stone-200/60 cursor-not-allowed`}
              />
            ) : (
              <input
                id="jobTitle"
                placeholder="e.g. Boiler replacement and system flush"
                className={inputCls}
                {...register("jobTitle")}
              />
            )}
          </div>
          <div>
            <label htmlFor="notes" className={labelCls}>
              Detailed Description
            </label>
            <Textarea
              id="notes"
              placeholder="Describe the project milestones and specific tasks..."
              rows={4}
              className="w-full bg-[#f4f3f2] border-0 rounded-lg py-3 px-4 text-sm text-stone-900 focus:ring-1 focus:ring-[#003629] focus:bg-white transition-all placeholder:text-stone-400 resize-none"
              {...register("notes")}
            />
          </div>

          {/* AI suggest button */}
          {watchedJobTitle.trim() && (
            <button
              type="button"
              onClick={handleSuggestItems}
              disabled={suggestLoading}
              className="inline-flex items-center gap-2 border border-[#003629]/30 text-[#003629] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#003629]/5 transition-colors disabled:opacity-60"
            >
              <Sparkles className="size-4" />
              {suggestLoading ? "Generating…" : "Suggest Line Items"}
            </button>
          )}
        </section>

        {/* ── Section 03: Line Items ── */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StepBadge step="03" />
              <h2 className="text-lg font-semibold font-heading text-stone-900">
                Line Items
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveTemplateClick}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 uppercase tracking-wider transition-colors"
                title="Save current items as a template"
              >
                <Save className="size-3.5" />
                Save Template
              </button>
              {templates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowLoadTemplate((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 uppercase tracking-wider transition-colors"
                  title="Load a saved template"
                >
                  <FolderOpen className="size-3.5" />
                  Load Template
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  append({ description: "", qty: 1, unitPrice: 0, vatRate: 20 })
                }
                className="inline-flex items-center gap-1.5 text-[#003629] text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                <Plus className="size-4" />
                Add Item
              </button>
            </div>
          </div>

          {/* Save template inline dialog */}
          {showSaveTemplate && (
            <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
              <Input
                autoFocus
                placeholder="Template name…"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmSaveTemplate();
                  if (e.key === "Escape") setShowSaveTemplate(false);
                }}
                className="h-8 text-sm border-stone-200"
              />
              <button
                type="button"
                onClick={handleConfirmSaveTemplate}
                className="px-3 py-1.5 bg-[#003629] text-white text-xs font-bold rounded"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowSaveTemplate(false)}
                className="text-stone-400 hover:text-stone-700"
                aria-label="Cancel"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Load template list */}
          {showLoadTemplate && templates.length > 0 && (
            <div className="rounded-lg border border-stone-200 bg-white shadow-sm">
              <p className="border-b border-stone-100 px-3 py-2 text-xs font-semibold text-stone-500">
                Saved Templates
              </p>
              <ul className="max-h-48 overflow-y-auto">
                {templates.map((tpl, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 hover:bg-stone-50"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadTemplate(tpl)}
                      className="flex-1 text-left text-sm font-medium hover:text-[#003629]"
                    >
                      {tpl.name}
                      <span className="ml-2 text-xs font-normal text-stone-400">
                        ({tpl.items.filter((i) => !i.isSectionHeader).length} items)
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(idx)}
                      aria-label="Delete template"
                      className="ml-2 text-stone-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Line item rows */}
          {fields.map((field, index) => {
            const isSectionHeader = field.isSectionHeader === true;

            if (isSectionHeader) {
              return (
                <div
                  key={field.id}
                  className="flex items-center gap-2 border-b border-stone-200 pb-1 pt-2"
                >
                  <AlignLeft className="size-4 shrink-0 text-stone-400" />
                  <input
                    placeholder="Section title…"
                    {...register(`lineItems.${index}.sectionTitle`)}
                    className="h-8 flex-1 border-0 bg-transparent p-0 text-sm font-semibold focus:ring-0 outline-none text-stone-800"
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Remove section"
                    className="flex size-8 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
                className="p-5 bg-[#f4f3f2] rounded-xl space-y-3"
              >
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-6 space-y-1">
                    <label className={labelCls}>Item Description</label>
                    <input
                      placeholder="Description"
                      className="w-full bg-white border-0 rounded-lg py-2 px-3 text-sm text-stone-900 focus:ring-1 focus:ring-[#003629] transition-all outline-none"
                      {...register(`lineItems.${index}.description`)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className={labelCls}>Qty</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="1"
                      className="w-full bg-white border-0 rounded-lg py-2 px-3 text-sm text-right text-stone-900 focus:ring-1 focus:ring-[#003629] transition-all outline-none"
                      {...register(`lineItems.${index}.qty`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <label className={labelCls}>Rate (£)</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400 text-sm">
                        £
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        className="w-full bg-white border-0 rounded-lg py-2 pl-7 pr-3 text-sm text-right text-stone-900 focus:ring-1 focus:ring-[#003629] transition-all outline-none"
                        {...register(`lineItems.${index}.unitPrice`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vatRate > 0}
                        onChange={(e) =>
                          setValue(
                            `lineItems.${index}.vatRate`,
                            e.target.checked ? 20 : 0,
                          )
                        }
                        className="rounded border-stone-200 text-[#003629] focus:ring-[#003629] w-4 h-4"
                      />
                      <span className="text-xs text-stone-500 font-medium">
                        Include VAT (20%)
                      </span>
                    </label>
                    <Select
                      defaultValue={String(field.vatRate)}
                      onValueChange={(val) =>
                        setValue(
                          `lineItems.${index}.vatRate`,
                          Number(val) as 0 | 5 | 20,
                        )
                      }
                    >
                      <SelectTrigger className="h-7 w-20 text-xs border-stone-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs font-medium text-stone-700">
                      = {fmtGbp(linePence)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length <= 1}
                    aria-label="Remove line item"
                    className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add section */}
          <button
            type="button"
            onClick={handleAddSectionHeader}
            className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-700 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <AlignLeft className="size-4" />
            Add Section
          </button>

          {/* Totals summary */}
          <div className="flex flex-col items-end gap-1.5 pt-3 px-5">
            <div className="flex justify-between w-full max-w-xs text-stone-500 text-sm">
              <span>Subtotal</span>
              <span>{fmtGbp(subtotalPence)}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-stone-500 text-sm">
              <span>VAT Total</span>
              <span>{fmtGbp(vatPence)}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-[#003629] font-bold text-lg pt-2 border-t border-stone-200">
              <span>Total Quote</span>
              <span>{fmtGbp(totalPence)}</span>
            </div>
          </div>

          {/* Staged Payments Toggle */}
          <div className="border-t border-stone-200 pt-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                {...register("stagedPaymentsEnabled")}
                className="size-4 rounded border-stone-200 accent-[#003629]"
              />
              <span className="text-sm font-medium text-stone-900">
                Enable staged payments
              </span>
            </label>
            <p className="mt-1 text-xs text-stone-500 ml-7">
              Split the total into payment milestones that the client pays over
              time.
            </p>
          </div>

          {stagedPaymentsEnabled && (
            <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Payment Milestones
              </p>

              {milestoneFields.map((mField, mIdx) => (
                <div key={mField.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Milestone label (e.g. Deposit)"
                    {...register(`milestones.${mIdx}.label`)}
                    className="flex-1 border-stone-200"
                  />
                  <div className="relative w-32">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400 text-sm">
                      £
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="pl-7 text-right border-stone-200"
                      {...register(`milestones.${mIdx}.amountPence`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMilestone(mIdx)}
                    aria-label="Remove milestone"
                    className="flex size-8 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => appendMilestone({ label: "", amountPence: 0 })}
                className="inline-flex items-center gap-2 border border-stone-200 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-100 transition-colors"
              >
                <Plus className="size-4" />
                Add Milestone
              </button>

              {milestoneFields.length > 0 && (
                <div
                  className={`mt-2 rounded-md px-3 py-2 text-sm ${
                    milestonesValid
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800"
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
        </section>

        {/* ── Section 04: Timeline & Terms ── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <StepBadge step="04" />
            <h2 className="text-lg font-semibold font-heading text-stone-900">
              Timeline &amp; Terms
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="validUntil" className={labelCls}>
                Expiry Date
              </label>
              <input
                id="validUntil"
                type="date"
                className={inputCls}
                {...register("validUntil")}
              />
            </div>
            <div>
              <label htmlFor="paymentTerms" className={labelCls}>
                Payment Terms
              </label>
              <select
                id="paymentTerms"
                className={inputCls}
              >
                <option>50% Deposit / 50% On Completion</option>
                <option>Net 30 Days</option>
                <option>Phased Payments</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── Action Footer ── */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-stone-200">
          <button
            type="button"
            disabled={submitting || formState.isSubmitting}
            onClick={handleSubmit((values) => submitQuote(values, "draft"))}
            className="px-7 py-3 text-stone-500 font-heading font-semibold text-sm hover:text-[#003629] transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting || formState.isSubmitting}
            onClick={handleSubmit((values) => submitQuote(values, "send"))}
            className="px-9 py-3.5 bg-gradient-to-r from-[#003629] to-[#1b4d3e] text-white rounded-lg font-heading font-bold text-sm shadow-lg shadow-[#003629]/10 active:scale-95 transition-all disabled:opacity-50"
          >
            Generate &amp; Send Quote
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right pane — Live PDF Preview                                       */}
      {/* ------------------------------------------------------------------ */}
      <aside className="lg:w-[420px] lg:sticky lg:top-24 lg:self-start">
        <div className="bg-stone-200/30 p-2 rounded-2xl border border-white/40 shadow-lg">
          <div className="bg-white rounded-xl overflow-hidden shadow-inner">
            <QuotePreview
              providerName={providerName}
              clientName={watchedClientName}
              jobTitle={watchedJobTitle}
              lineItems={watchedItems}
              notes={watchedNotes}
              validUntil={watchedValidUntil}
            />
          </div>
          {/* Preview controls */}
          <div className="flex justify-between items-center px-4 py-2.5">
            <p className="text-[10px] text-stone-500 font-medium">
              PDF Preview • Real-time Sync
            </p>
            <div className="flex gap-1">
              <button className="p-1.5 hover:bg-white rounded transition-colors text-stone-400">
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0zM10.5 7.5v6m3-3h-6"
                  />
                </svg>
              </button>
              <button className="p-1.5 hover:bg-white rounded transition-colors text-stone-400">
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
                  />
                </svg>
              </button>
              <button className="p-1.5 hover:bg-white rounded transition-colors text-stone-400">
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

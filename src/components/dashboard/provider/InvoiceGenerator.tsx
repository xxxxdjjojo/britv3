"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, Download, CheckCircle2 } from "lucide-react";
import { InvoicePreview } from "./InvoicePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InvoiceLineItem } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvoiceLineItemRow = {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number; // GBP (float)
  vatRate: number; // 0 | 5 | 20
};

type InvoiceFormValues = {
  clientName: string;
  clientId: string;
  lineItems: InvoiceLineItemRow[];
  dueDateDays: number;
  paymentTerms: string;
  notes: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultDueDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function calcLinePence(qty: number, unitPrice: number): number {
  return Math.round((Number(qty) || 0) * Math.round((Number(unitPrice) || 0) * 100));
}

function rowToInvoiceLineItem(row: InvoiceLineItemRow): InvoiceLineItem {
  return {
    name: row.name || "Item",
    description: row.description || undefined,
    quantity: Number(row.quantity) || 1,
    unit_price_pence: Math.round((Number(row.unitPrice) || 0) * 100),
    total_pence: calcLinePence(row.quantity, row.unitPrice),
    vat_rate: Number(row.vatRate) / 100,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type InvoiceGeneratorProps = Readonly<{
  providerId: string;
  providerName: string;
  providerEmail?: string;
  quoteId: string;
  prefillLineItems?: InvoiceLineItem[];
  prefillClientId?: string;
  prefillClientName?: string;
  prefillNotes?: string;
}>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceGenerator({
  providerName,
  providerEmail,
  prefillLineItems,
  prefillClientId,
  prefillClientName,
  prefillNotes,
}: InvoiceGeneratorProps) {
  const [submitting, setSubmitting] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Convert prefill line items to form rows
  const prefillRows: InvoiceLineItemRow[] = (prefillLineItems ?? []).map((item) => ({
    name: item.name,
    description: item.description ?? "",
    quantity: item.quantity,
    unitPrice: item.unit_price_pence / 100,
    vatRate: Math.round((item.vat_rate ?? 0.2) * 100),
  }));

  const defaultValues: InvoiceFormValues = {
    clientName: prefillClientName ?? "",
    clientId: prefillClientId ?? "",
    lineItems:
      prefillRows.length > 0
        ? prefillRows
        : [{ name: "", description: "", quantity: 1, unitPrice: 0, vatRate: 20 }],
    dueDateDays: 14,
    paymentTerms: "Payment due within 14 days of invoice date. Bank transfer preferred.",
    notes: prefillNotes ?? "",
  };

  const form = useForm<InvoiceFormValues>({ defaultValues });
  const { register, control, handleSubmit, watch, formState } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedValues = useWatch({ control });
  const watchedItems = (watchedValues.lineItems ?? []) as InvoiceLineItemRow[];
  const watchedDueDateDays = Number(watchedValues.dueDateDays) || 14;
  const watchedPaymentTerms = (watchedValues.paymentTerms ?? "") as string;
  const watchedNotes = (watchedValues.notes ?? "") as string;
  const watchedClientName = (watchedValues.clientName ?? "") as string;

  // Keep dueDateDays in sync via separate watch (avoids race with useWatch)
  const dueDateDaysLive = Number(watch("dueDateDays")) || 14;

  const [dueDatePreview, setDueDatePreview] = useState(
    defaultDueDate(defaultValues.dueDateDays),
  );

  useEffect(() => {
    setDueDatePreview(defaultDueDate(dueDateDaysLive));
  }, [dueDateDaysLive]);

  // ---- Preview line items
  const previewLineItems: InvoiceLineItem[] = watchedItems.map(rowToInvoiceLineItem);

  // ---- Handlers ---------------------------------------------------------------

  async function handleGenerateInvoice(values: InvoiceFormValues) {
    setSubmitting(true);
    try {
      const lineItems = values.lineItems.map(rowToInvoiceLineItem);

      const res = await fetch("/api/provider/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: values.clientId || values.clientName || "unknown",
          line_items: lineItems,
          due_date_days: Number(values.dueDateDays) || 14,
          notes: values.notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to generate invoice");
      }

      const invoice = (await res.json()) as { id: string; invoice_number: string };
      setSavedInvoiceId(invoice.id);
      setSavedInvoiceNumber(invoice.invoice_number);
      toast.success(`Invoice ${invoice.invoice_number} created.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkPaid() {
    if (!savedInvoiceId) return;
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/provider/invoices/${savedInvoiceId}/paid`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to mark as paid");
      }
      setIsPaid(true);
      toast.success("Invoice marked as paid.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      toast.error(message);
    } finally {
      setMarkingPaid(false);
    }
  }

  async function handleDownloadPdf() {
    if (!savedInvoiceId) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/provider/invoices/${savedInvoiceId}/pdf`);
      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }
      // Determine response type
      const contentType = res.headers.get("content-type") ?? "";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = contentType.includes("pdf")
        ? `${savedInvoiceNumber ?? "invoice"}.pdf`
        : `${savedInvoiceNumber ?? "invoice"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      toast.error(message);
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ------------------------------------------------------------------ */}
      {/* Left pane — Form                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-6">
        {/* Saved invoice banner */}
        {savedInvoiceId && (
          <div className="flex items-center justify-between rounded-lg border border-success/20 bg-success-light px-4 py-3 text-sm dark:border-success/30 dark:bg-success/10">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                Invoice <strong>{savedInvoiceNumber}</strong> saved.{" "}
                {isPaid ? "Marked as paid." : ""}
              </span>
            </div>
          </div>
        )}

        {/* Client section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="clientName"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Client Name
              </label>
              <Input
                id="clientName"
                placeholder="e.g. Jane Smith"
                {...register("clientName")}
              />
            </div>
            <div>
              <label
                htmlFor="clientId"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Client ID{" "}
                <span className="text-xs text-muted-foreground">(UUID or reference)</span>
              </label>
              <Input
                id="clientId"
                placeholder="Client user ID or external reference"
                {...register("clientId")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Column headers */}
            <div className="hidden grid-cols-[1fr_56px_88px_64px_80px_32px] gap-2 text-xs font-medium text-muted-foreground sm:grid">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">VAT %</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            {fields.map((field, index) => {
              const qty = Number(watchedItems[index]?.quantity) || 0;
              const unitPrice = Number(watchedItems[index]?.unitPrice) || 0;
              const linePence = calcLinePence(qty, unitPrice);

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_56px_88px_64px_80px_32px] sm:items-center"
                >
                  <Input
                    placeholder="Item name"
                    {...register(`lineItems.${index}.name`)}
                  />
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Qty"
                    className="text-right"
                    {...register(`lineItems.${index}.quantity`, {
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
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    step={5}
                    placeholder="20"
                    className="text-right"
                    {...register(`lineItems.${index}.vatRate`, {
                      valueAsNumber: true,
                    })}
                  />
                  <div className="text-right text-sm font-medium text-foreground sm:pr-1">
                    £{(linePence / 100).toFixed(2)}
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
                append({
                  name: "",
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  vatRate: 20,
                })
              }
              className="gap-2"
            >
              <Plus className="size-4" />
              Add Row
            </Button>
          </CardContent>
        </Card>

        {/* Invoice details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="dueDateDays"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Payment Due
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="dueDateDays"
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  className="w-24"
                  {...register("dueDateDays", { valueAsNumber: true })}
                />
                <span className="text-sm text-muted-foreground">
                  days from issue &mdash; due{" "}
                  <span className="font-medium text-foreground">
                    {dueDatePreview}
                  </span>
                </span>
              </div>
            </div>
            <div>
              <label
                htmlFor="paymentTerms"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Payment Terms
              </label>
              <Input
                id="paymentTerms"
                placeholder="e.g. Bank transfer, 14 days"
                {...register("paymentTerms")}
              />
            </div>
            <div>
              <label
                htmlFor="notes"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Notes
              </label>
              <Textarea
                id="notes"
                placeholder="Any additional notes for the client…"
                rows={3}
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {!savedInvoiceId ? (
            <Button
              type="button"
              disabled={submitting || formState.isSubmitting}
              onClick={handleSubmit(handleGenerateInvoice)}
            >
              {submitting ? "Generating…" : "Generate Invoice"}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={markingPaid || isPaid}
                onClick={handleMarkPaid}
                className="gap-2"
              >
                <CheckCircle2 className="size-4" />
                {isPaid ? "Paid" : markingPaid ? "Marking…" : "Mark as Paid"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={downloadingPdf}
                onClick={handleDownloadPdf}
                className="gap-2"
              >
                <Download className="size-4" />
                {downloadingPdf ? "Preparing…" : "Download PDF"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right pane — Preview                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Live Preview
        </p>
        <InvoicePreview
          invoiceNumber={savedInvoiceNumber ?? undefined}
          dueDate={dueDatePreview}
          providerName={providerName}
          providerEmail={providerEmail}
          clientName={watchedClientName}
          lineItems={previewLineItems}
          paymentTerms={watchedPaymentTerms}
          notes={watchedNotes}
        />
      </div>
    </div>
  );
}

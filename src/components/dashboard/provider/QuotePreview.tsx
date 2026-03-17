"use client";

import type { LineItemRow } from "./QuoteBuilderForm";

type QuotePreviewProps = Readonly<{
  providerName: string;
  clientName: string;
  jobTitle: string;
  lineItems: LineItemRow[];
  notes: string;
  validUntil: string;
  quoteRef?: string;
}>;

export function QuotePreview({
  providerName,
  clientName,
  jobTitle,
  lineItems,
  notes,
  validUntil,
  quoteRef,
}: QuotePreviewProps) {
  // Compute totals
  const subtotalPence = lineItems.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const price = Math.round((Number(item.unitPrice) || 0) * 100);
    return sum + qty * price;
  }, 0);

  const vatPence = lineItems.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const price = Math.round((Number(item.unitPrice) || 0) * 100);
    const vatRate = Number(item.vatRate) / 100;
    return sum + qty * price * vatRate;
  }, 0);

  const totalPence = subtotalPence + vatPence;

  const fmt = (pence: number) =>
    (pence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" });

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-border bg-white p-8 shadow-sm dark:bg-neutral-900 print:shadow-none">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Britestate
          </div>
          <h2 className="text-2xl font-bold text-foreground">Quote</h2>
          {quoteRef && (
            <p className="mt-1 text-sm text-muted-foreground">Ref: {quoteRef}</p>
          )}
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>Date: {today}</p>
          {validUntil && (
            <p>
              Valid until:{" "}
              {new Date(validUntil).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      {/* From / To */}
      <div className="mb-8 grid grid-cols-2 gap-6">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            From
          </p>
          <p className="font-medium text-foreground">{providerName || "Your Name"}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            To
          </p>
          <p className="font-medium text-foreground">{clientName || "Client Name"}</p>
        </div>
      </div>

      {/* Job title */}
      {jobTitle && (
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Job
          </p>
          <p className="text-foreground">{jobTitle}</p>
        </div>
      )}

      {/* Line items table */}
      <div className="mb-6 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-semibold text-foreground">
                Description
              </th>
              <th className="px-4 py-2 text-right font-semibold text-foreground">Qty</th>
              <th className="px-4 py-2 text-right font-semibold text-foreground">
                Unit Price
              </th>
              <th className="px-4 py-2 text-right font-semibold text-foreground">
                VAT %
              </th>
              <th className="px-4 py-2 text-right font-semibold text-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No line items yet
                </td>
              </tr>
            ) : (
              lineItems.map((item, i) => {
                const qty = Number(item.qty) || 0;
                const unitPence = Math.round((Number(item.unitPrice) || 0) * 100);
                const linePence = qty * unitPence;
                return (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 text-foreground">
                      {item.description || (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">{qty}</td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {fmt(unitPence)}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {item.vatRate}%
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {fmt(linePence)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mb-6 flex justify-end">
        <dl className="w-48 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium text-foreground">{fmt(subtotalPence)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">VAT</dt>
            <dd className="font-medium text-foreground">{fmt(vatPence)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt className="font-bold text-foreground">Total</dt>
            <dd className="font-bold text-foreground">{fmt(totalPence)}</dd>
          </div>
        </dl>
      </div>

      {/* Notes */}
      {notes && (
        <div className="rounded-lg bg-muted/40 px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{notes}</p>
        </div>
      )}
    </div>
  );
}

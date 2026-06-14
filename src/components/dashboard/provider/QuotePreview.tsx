
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
  // Compute totals (skip section header rows)
  const subtotalPence = lineItems.reduce((sum, item) => {
    if (item.isSectionHeader) return sum;
    const qty = Number(item.qty) || 0;
    const price = Math.round((Number(item.unitPrice) || 0) * 100);
    return sum + qty * price;
  }, 0);

  const vatPence = lineItems.reduce((sum, item) => {
    if (item.isSectionHeader) return sum;
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
    <div className="rounded-xl border border-border bg-white shadow-md dark:bg-neutral-900 print:shadow-none">
      {/* Branded top bar */}
      <div className="rounded-t-xl bg-brand-primary-dark px-6 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-gold">
          Britestate
        </p>
        <h2 className="font-heading text-xl font-bold text-white">Quote</h2>
        {quoteRef && (
          <p className="mt-0.5 text-xs text-white/60">Ref: {quoteRef}</p>
        )}
      </div>

      <div className="p-6">
        {/* Date row */}
        <div className="mb-6 flex items-start justify-between text-sm text-muted-foreground">
          <span>Date: {today}</span>
          {validUntil && (
            <span>
              Valid until:{" "}
              {new Date(validUntil).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {/* From / To */}
        <div className="mb-6 grid grid-cols-2 gap-6 rounded-xl bg-surface p-4">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              From
            </p>
            <p className="font-medium text-foreground">{providerName || "Your Name"}</p>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              To
            </p>
            <p className="font-medium text-foreground">{clientName || "Client Name"}</p>
          </div>
        </div>

        {/* Job title */}
        {jobTitle && (
          <div className="mb-6">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Job
            </p>
            <p className="text-foreground">{jobTitle}</p>
          </div>
        )}

        {/* Line items table */}
        <div className="mb-6 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                  Description
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">Qty</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                  Unit Price
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                  VAT %
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No line items yet
                  </td>
                </tr>
              ) : (
                lineItems.map((item, i) => {
                  if (item.isSectionHeader) {
                    return (
                      <tr key={i} className="border-b border-border bg-surface">
                        <td
                          colSpan={5}
                          className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-primary-dark"
                        >
                          {item.sectionTitle || "Section"}
                        </td>
                      </tr>
                    );
                  }
                  const qty = Number(item.qty) || 0;
                  const unitPence = Math.round((Number(item.unitPrice) || 0) * 100);
                  const linePence = qty * unitPence;
                  return (
                    <tr
                      key={i}
                      className="border-b border-border last:border-0 hover:bg-surface/50"
                    >
                      <td className="px-4 py-3 text-foreground">
                        {item.description || (
                          <span className="italic text-muted-foreground">—</span>
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
          <dl className="w-52 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium text-foreground">{fmt(subtotalPence)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VAT</dt>
              <dd className="font-medium text-foreground">{fmt(vatPence)}</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-brand-primary-dark px-3 py-2">
              <dt className="font-bold text-white">Total</dt>
              <dd className="font-bold text-brand-gold">{fmt(totalPence)}</dd>
            </div>
          </dl>
        </div>

        {/* Notes */}
        {notes && (
          <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Notes
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}


import type { InvoiceLineItem } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InvoicePreviewProps = Readonly<{
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  providerName: string;
  providerEmail?: string;
  clientName: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  paymentTerms?: string;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtGbp(pence: number): string {
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
  });
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoicePreview({
  invoiceNumber,
  issueDate,
  dueDate,
  providerName,
  providerEmail,
  clientName,
  lineItems,
  notes,
  paymentTerms,
}: InvoicePreviewProps) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Compute totals from line items
  const subtotalPence = lineItems.reduce((s, item) => s + item.total_pence, 0);
  const vatPence = lineItems.reduce((s, item) => {
    const rate = item.vat_rate ?? 0.2;
    return s + Math.round(item.total_pence * rate);
  }, 0);
  const totalPence = subtotalPence + vatPence;

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm dark:bg-neutral-900 print:shadow-none">
      {/* Britestate brand header bar */}
      <div
        className="flex items-center justify-between rounded-t-xl px-8 py-4"
        style={{ backgroundColor: "#1B4D3E" }}
      >
        <span className="text-lg font-bold tracking-widest text-white">
          BRITESTATE
        </span>
        <span className="text-sm font-semibold uppercase tracking-wider text-white/70">
          Invoice
        </span>
      </div>

      {/* Body */}
      <div className="p-8">
        {/* Invoice meta: number + dates */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Invoice</h2>
            {invoiceNumber && (
              <p className="mt-1 text-sm text-muted-foreground">
                {invoiceNumber}
              </p>
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground space-y-0.5">
            <p>
              <span className="font-medium text-foreground">Issue date:</span>{" "}
              {issueDate ? fmtDate(issueDate) : today}
            </p>
            {dueDate && (
              <p>
                <span className="font-medium text-foreground">Due date:</span>{" "}
                {fmtDate(dueDate)}
              </p>
            )}
          </div>
        </div>

        {/* Provider / Client */}
        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              From
            </p>
            <p className="font-medium text-foreground">
              {providerName || "Your Business"}
            </p>
            {providerEmail && (
              <p className="text-sm text-muted-foreground">{providerEmail}</p>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bill To
            </p>
            <p className="font-medium text-foreground">
              {clientName || "Client"}
            </p>
          </div>
        </div>

        {/* Line items table */}
        <div className="mb-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-semibold text-foreground">
                  Description
                </th>
                <th className="px-4 py-2 text-right font-semibold text-foreground">
                  Qty
                </th>
                <th className="px-4 py-2 text-right font-semibold text-foreground">
                  Unit Price
                </th>
                <th className="px-4 py-2 text-right font-semibold text-foreground">
                  VAT
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
                  const unitPence = Math.round(
                    item.total_pence / (item.quantity || 1),
                  );
                  const vatRate = item.vat_rate ?? 0.2;
                  return (
                    <tr
                      key={i}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 text-foreground">
                        <span className="font-medium">{item.name}</span>
                        {item.description && (
                          <span className="block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {fmtGbp(unitPence)}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {Math.round(vatRate * 100)}%
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {fmtGbp(item.total_pence)}
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
          <dl className="w-52 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium text-foreground">
                {fmtGbp(subtotalPence)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VAT</dt>
              <dd className="font-medium text-foreground">{fmtGbp(vatPence)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="font-bold text-foreground">Total Due</dt>
              <dd className="font-bold text-foreground">
                {fmtGbp(totalPence)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Payment terms */}
        {paymentTerms && (
          <div className="mb-4 rounded-lg border border-border px-4 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Terms
            </p>
            <p className="text-sm text-foreground">{paymentTerms}</p>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div className="rounded-lg bg-muted/40 px-4 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

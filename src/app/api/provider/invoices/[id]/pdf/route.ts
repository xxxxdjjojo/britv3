/**
 * GET /api/provider/invoices/[id]/pdf
 *
 * Returns a PDF of the invoice. Uses @react-pdf/renderer (server-side only,
 * excluded from SSR bundle via serverExternalPackages in next.config.ts).
 *
 * Falls back to a styled HTML response if PDF generation fails.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProviderInvoice, InvoiceLineItem } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtGbp(pence: number): string {
  return (pence / 100).toFixed(2);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
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
// HTML fallback generator
// ---------------------------------------------------------------------------

function buildHtmlInvoice(invoice: ProviderInvoice, providerName: string): string {
  const subtotalPence = invoice.subtotal;
  const vatPence = invoice.vat_amount;
  const totalPence = invoice.total_amount;

  const lineItemsHtml = (invoice.line_items as InvoiceLineItem[])
    .map(
      (item) => `
      <tr>
        <td>${item.name}${item.description ? `<br/><small>${item.description}</small>` : ""}</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">£${fmtGbp(item.unit_price_pence)}</td>
        <td style="text-align:right">${Math.round((item.vat_rate ?? 0.2) * 100)}%</td>
        <td style="text-align:right">£${fmtGbp(item.total_pence)}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 48px; }
    .header { background: #1B4D3E; color: #fff; padding: 16px 24px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center; }
    .header .brand { font-weight: 700; font-size: 18px; letter-spacing: 4px; }
    .header .label { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.7; }
    .body { border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 32px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .meta h1 { font-size: 24px; font-weight: 700; }
    .meta .ref { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .meta .dates { text-align: right; font-size: 14px; color: #6b7280; }
    .meta .dates p { margin-bottom: 4px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .parties .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 4px; }
    .parties .name { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px; }
    thead tr { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    th { padding: 8px 12px; text-align: left; font-weight: 600; }
    th:not(:first-child) { text-align: right; }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
    td small { color: #9ca3af; font-size: 12px; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals dl { width: 200px; font-size: 14px; }
    .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .total { border-top: 1px solid #e5e7eb; padding-top: 8px; font-weight: 700; }
    .notes { background: #f9fafb; border-radius: 6px; padding: 12px 16px; font-size: 14px; }
    .notes .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="header">
    <span class="brand">BRITESTATE</span>
    <span class="label">Invoice</span>
  </div>
  <div class="body">
    <div class="meta">
      <div>
        <h1>Invoice</h1>
        <p class="ref">${invoice.invoice_number}</p>
      </div>
      <div class="dates">
        <p><strong>Issue date:</strong> ${fmtDate(invoice.created_at)}</p>
        ${invoice.due_date ? `<p><strong>Due date:</strong> ${fmtDate(invoice.due_date)}</p>` : ""}
        <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
      </div>
    </div>
    <div class="parties">
      <div>
        <p class="label">From</p>
        <p class="name">${providerName}</p>
      </div>
      <div>
        <p class="label">Bill To</p>
        <p class="name">${invoice.client_id}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:right">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">VAT</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${lineItemsHtml}</tbody>
    </table>
    <div class="totals">
      <dl>
        <div class="row"><dt>Subtotal</dt><dd>£${fmtGbp(subtotalPence)}</dd></div>
        <div class="row"><dt>VAT</dt><dd>£${fmtGbp(vatPence)}</dd></div>
        <div class="row total"><dt>Total Due</dt><dd>£${fmtGbp(totalPence)}</dd></div>
      </dl>
    </div>
    ${invoice.notes ? `<div class="notes"><p class="label">Notes</p><p>${invoice.notes}</p></div>` : ""}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// GET /api/provider/invoices/[id]/pdf
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { id: invoiceId } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Resolve provider
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = (providerProfile?.id as string | null | undefined) ?? user.id;
  const providerName =
    (providerProfile?.business_name as string | null | undefined) ??
    user.email ??
    "Provider";

  // Fetch invoice (RLS enforces ownership)
  const { data: invoiceData, error } = await supabase
    .from("provider_invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (error || !invoiceData) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const invoice = invoiceData as ProviderInvoice;

  // Try @react-pdf/renderer PDF generation
  try {
    // Dynamic import so it stays server-side only (serverExternalPackages handles bundling)
    const {
      Document,
      Page,
      Text,
      View,
      StyleSheet,
      renderToBuffer,
    } = await import("@react-pdf/renderer");
    const React = await import("react");

    const styles = StyleSheet.create({
      page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
      header: {
        backgroundColor: "#1B4D3E",
        padding: "12 16",
        marginBottom: 24,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      headerBrand: { color: "#ffffff", fontSize: 14, fontFamily: "Helvetica-Bold", letterSpacing: 3 },
      headerLabel: { color: "#ffffffb3", fontSize: 9, letterSpacing: 2 },
      metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
      metaLeft: { flex: 1 },
      metaRight: { flex: 1, alignItems: "flex-end" },
      h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
      muted: { color: "#6b7280", fontSize: 9 },
      partiesRow: { flexDirection: "row", marginBottom: 20, gap: 16 },
      partyBlock: { flex: 1 },
      sectionLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
      partyName: { fontFamily: "Helvetica-Bold", fontSize: 10 },
      tableHeader: { flexDirection: "row", backgroundColor: "#f9fafb", padding: "6 8", borderBottom: "1 solid #e5e7eb" },
      tableRow: { flexDirection: "row", padding: "6 8", borderBottom: "1 solid #f3f4f6" },
      col1: { flex: 3 },
      col2: { flex: 1, textAlign: "right" },
      thText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
      totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, marginBottom: 16 },
      totalsBlock: { width: 160 },
      totalLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
      totalFinalLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1 solid #e5e7eb" },
      totalFinalText: { fontFamily: "Helvetica-Bold", fontSize: 10 },
      notesBox: { backgroundColor: "#f9fafb", padding: "8 10", marginTop: 8 },
    });

    const lineItems = invoice.line_items as InvoiceLineItem[];

    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: "A4", style: styles.page },
        // Brand header
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(Text, { style: styles.headerBrand }, "BRITESTATE"),
          React.createElement(Text, { style: styles.headerLabel }, "INVOICE"),
        ),
        // Meta
        React.createElement(
          View,
          { style: styles.metaRow },
          React.createElement(
            View,
            { style: styles.metaLeft },
            React.createElement(Text, { style: styles.h1 }, "Invoice"),
            React.createElement(Text, { style: styles.muted }, invoice.invoice_number),
          ),
          React.createElement(
            View,
            { style: styles.metaRight },
            React.createElement(
              Text,
              { style: styles.muted },
              `Issue date: ${fmtDate(invoice.created_at)}`,
            ),
            invoice.due_date
              ? React.createElement(
                  Text,
                  { style: styles.muted },
                  `Due date: ${fmtDate(invoice.due_date)}`,
                )
              : null,
            React.createElement(
              Text,
              { style: styles.muted },
              `Status: ${invoice.status.toUpperCase()}`,
            ),
          ),
        ),
        // From / Bill To
        React.createElement(
          View,
          { style: styles.partiesRow },
          React.createElement(
            View,
            { style: styles.partyBlock },
            React.createElement(Text, { style: styles.sectionLabel }, "From"),
            React.createElement(Text, { style: styles.partyName }, providerName),
          ),
          React.createElement(
            View,
            { style: styles.partyBlock },
            React.createElement(Text, { style: styles.sectionLabel }, "Bill To"),
            React.createElement(Text, { style: styles.partyName }, invoice.client_id),
          ),
        ),
        // Table header
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: [styles.col1, styles.thText] }, "Description"),
          React.createElement(Text, { style: [styles.col2, styles.thText] }, "Qty"),
          React.createElement(Text, { style: [styles.col2, styles.thText] }, "Unit Price"),
          React.createElement(Text, { style: [styles.col2, styles.thText] }, "VAT"),
          React.createElement(Text, { style: [styles.col2, styles.thText] }, "Total"),
        ),
        // Table rows
        ...lineItems.map((item, i) =>
          React.createElement(
            View,
            { key: String(i), style: styles.tableRow },
            React.createElement(
              Text,
              { style: styles.col1 },
              `${item.name}${item.description ? `\n${item.description}` : ""}`,
            ),
            React.createElement(Text, { style: styles.col2 }, String(item.quantity)),
            React.createElement(Text, { style: styles.col2 }, `£${fmtGbp(item.unit_price_pence)}`),
            React.createElement(
              Text,
              { style: styles.col2 },
              `${Math.round((item.vat_rate ?? 0.2) * 100)}%`,
            ),
            React.createElement(Text, { style: styles.col2 }, `£${fmtGbp(item.total_pence)}`),
          ),
        ),
        // Totals
        React.createElement(
          View,
          { style: styles.totalsRow },
          React.createElement(
            View,
            { style: styles.totalsBlock },
            React.createElement(
              View,
              { style: styles.totalLine },
              React.createElement(Text, null, "Subtotal"),
              React.createElement(Text, null, `£${fmtGbp(invoice.subtotal)}`),
            ),
            React.createElement(
              View,
              { style: styles.totalLine },
              React.createElement(Text, null, "VAT"),
              React.createElement(Text, null, `£${fmtGbp(invoice.vat_amount)}`),
            ),
            React.createElement(
              View,
              { style: styles.totalFinalLine },
              React.createElement(Text, { style: styles.totalFinalText }, "Total Due"),
              React.createElement(Text, { style: styles.totalFinalText }, `£${fmtGbp(invoice.total_amount)}`),
            ),
          ),
        ),
        // Notes
        invoice.notes
          ? React.createElement(
              View,
              { style: styles.notesBox },
              React.createElement(Text, { style: styles.sectionLabel }, "Notes"),
              React.createElement(Text, null, invoice.notes),
            )
          : null,
      ),
    );

    const pdfBuffer = await renderToBuffer(doc);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch {
    // Fall back to HTML response the browser can print-to-PDF
    const html = buildHtmlInvoice(invoice, providerName);
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${invoice.invoice_number}.html"`,
      },
    });
  }
}

/**
 * GET /api/provider/quotes/[id]/pdf
 *
 * Returns a PDF of the quote. Uses @react-pdf/renderer (server-side only,
 * excluded from SSR bundle via serverExternalPackages in next.config.ts).
 *
 * Falls back to a styled HTML response if PDF generation fails.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Quote, QuoteLineItem } from "@/services/provider/provider-quote-service";

// ---------------------------------------------------------------------------
// Extended types for quote PDF features
// ---------------------------------------------------------------------------

type QuoteLineItemWithSection = QuoteLineItem & {
  is_section_header?: boolean;
  section_title?: string;
  vat_rate?: number;
};

type MilestoneRecord = {
  label: string;
  amount_pence: number;
};

type QuoteRow = Quote & {
  scope_of_work?: string | null;
  validity_date?: string | null;
  milestones?: MilestoneRecord[] | null;
  line_items: QuoteLineItemWithSection[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtGbp(pence: number): string {
  return (pence / 100).toFixed(2);
}

function fmtDate(iso: string | null | undefined): string {
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

function buildHtmlQuote(quote: QuoteRow, providerName: string): string {
  const subtotalPence = quote.subtotal;
  const vatPence = 0; // VAT not stored separately on quotes; total_amount is the source of truth
  const totalPence = quote.total_amount;

  const lineItems = quote.line_items as QuoteLineItemWithSection[];

  const lineItemsHtml = lineItems
    .map((item) => {
      if (item.is_section_header) {
        return `<tr style="background:#f3f4f6"><td colspan="5" style="padding:6px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">${item.section_title ?? "Section"}</td></tr>`;
      }
      return `
      <tr>
        <td>${item.name}${item.description ? `<br/><small>${item.description}</small>` : ""}</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">£${fmtGbp(item.unit_price_pence)}</td>
        <td style="text-align:right">${Math.round((item.vat_rate ?? 0.2) * 100)}%</td>
        <td style="text-align:right">£${fmtGbp(item.total_pence)}</td>
      </tr>`;
    })
    .join("");

  const milestonesHtml =
    quote.milestones && quote.milestones.length > 0
      ? `<div style="margin-top:24px">
          <h3 style="font-size:13px;font-weight:700;margin-bottom:8px">Payment Schedule</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb">
              <th style="padding:8px 12px;text-align:left;font-weight:600">Milestone</th>
              <th style="padding:8px 12px;text-align:right;font-weight:600">Amount</th>
            </tr></thead>
            <tbody>
              ${quote.milestones.map((m) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${m.label}</td><td style="padding:8px 12px;text-align:right;border-bottom:1px solid #f3f4f6">£${fmtGbp(m.amount_pence)}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Quote ${quote.quote_number}</title>
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
    .scope { background: #f9fafb; border-radius: 6px; padding: 12px 16px; font-size: 14px; margin-bottom: 24px; }
    .scope .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; }
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
    <span class="label">Quote</span>
  </div>
  <div class="body">
    <div class="meta">
      <div>
        <h1>Quote</h1>
        <p class="ref">${quote.quote_number}</p>
      </div>
      <div class="dates">
        <p><strong>Issue date:</strong> ${fmtDate(quote.created_at)}</p>
        ${quote.valid_until ? `<p><strong>Valid until:</strong> ${fmtDate(quote.valid_until)}</p>` : ""}
        ${quote.validity_date ? `<p><strong>Validity date:</strong> ${fmtDate(quote.validity_date)}</p>` : ""}
        <p><strong>Status:</strong> ${quote.status.toUpperCase()}</p>
      </div>
    </div>
    <div class="parties">
      <div>
        <p class="label">From</p>
        <p class="name">${providerName}</p>
      </div>
      <div>
        <p class="label">Prepared For</p>
        <p class="name">${quote.request_id ?? "Client"}</p>
      </div>
    </div>
    ${quote.scope_of_work ? `<div class="scope"><p class="label">Scope of Work</p><p>${quote.scope_of_work}</p></div>` : ""}
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
        <div class="row total"><dt>Total</dt><dd>£${fmtGbp(totalPence)}</dd></div>
      </dl>
    </div>
    ${quote.notes ? `<div class="notes"><p class="label">Notes</p><p>${quote.notes}</p></div>` : ""}
    ${milestonesHtml}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// GET /api/provider/quotes/[id]/pdf
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { id: quoteId } = await context.params;

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

  // Fetch quote (verify provider ownership)
  const { data: quoteData, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (error || !quoteData) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const quote = quoteData as QuoteRow;

  // Try @react-pdf/renderer PDF generation
  try {
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
      scopeBox: { backgroundColor: "#f9fafb", padding: "8 10", marginBottom: 16 },
      tableHeader: { flexDirection: "row", backgroundColor: "#f9fafb", padding: "6 8", borderBottom: "1 solid #e5e7eb" },
      tableRow: { flexDirection: "row", padding: "6 8", borderBottom: "1 solid #f3f4f6" },
      tableSectionRow: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "4 8", borderBottom: "1 solid #e5e7eb" },
      tableSectionText: { fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase", letterSpacing: 1 },
      col1: { flex: 3 },
      col2: { flex: 1, textAlign: "right" },
      thText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
      totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, marginBottom: 16 },
      totalsBlock: { width: 160 },
      totalLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
      totalFinalLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1 solid #e5e7eb" },
      totalFinalText: { fontFamily: "Helvetica-Bold", fontSize: 10 },
      notesBox: { backgroundColor: "#f9fafb", padding: "8 10", marginTop: 8 },
      milestonesBox: { marginTop: 16 },
      milestonesTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 8 },
      milestoneRow: { flexDirection: "row", justifyContent: "space-between", padding: "4 0", borderBottom: "1 solid #f3f4f6" },
    });

    const lineItems = quote.line_items as QuoteLineItemWithSection[];

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
          React.createElement(Text, { style: styles.headerLabel }, "QUOTE"),
        ),
        // Meta
        React.createElement(
          View,
          { style: styles.metaRow },
          React.createElement(
            View,
            { style: styles.metaLeft },
            React.createElement(Text, { style: styles.h1 }, "Quote"),
            React.createElement(Text, { style: styles.muted }, quote.quote_number),
          ),
          React.createElement(
            View,
            { style: styles.metaRight },
            React.createElement(
              Text,
              { style: styles.muted },
              `Issue date: ${fmtDate(quote.created_at)}`,
            ),
            (quote.valid_until ?? quote.validity_date)
              ? React.createElement(
                  Text,
                  { style: styles.muted },
                  `Valid until: ${fmtDate(quote.valid_until ?? quote.validity_date)}`,
                )
              : null,
            React.createElement(
              Text,
              { style: styles.muted },
              `Status: ${quote.status.toUpperCase()}`,
            ),
          ),
        ),
        // From / Prepared For
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
            React.createElement(Text, { style: styles.sectionLabel }, "Prepared For"),
            React.createElement(Text, { style: styles.partyName }, quote.request_id ?? "Client"),
          ),
        ),
        // Scope of work
        quote.scope_of_work
          ? React.createElement(
              View,
              { style: styles.scopeBox },
              React.createElement(Text, { style: styles.sectionLabel }, "Scope of Work"),
              React.createElement(Text, null, quote.scope_of_work),
            )
          : null,
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
        ...lineItems.map((item, i) => {
          if (item.is_section_header) {
            return React.createElement(
              View,
              { key: String(i), style: styles.tableSectionRow },
              React.createElement(
                Text,
                { style: styles.tableSectionText },
                item.section_title ?? "Section",
              ),
            );
          }
          return React.createElement(
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
          );
        }),
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
              React.createElement(Text, null, `£${fmtGbp(quote.subtotal)}`),
            ),
            React.createElement(
              View,
              { style: styles.totalFinalLine },
              React.createElement(Text, { style: styles.totalFinalText }, "Total"),
              React.createElement(Text, { style: styles.totalFinalText }, `£${fmtGbp(quote.total_amount)}`),
            ),
          ),
        ),
        // Notes
        quote.notes
          ? React.createElement(
              View,
              { style: styles.notesBox },
              React.createElement(Text, { style: styles.sectionLabel }, "Notes"),
              React.createElement(Text, null, quote.notes),
            )
          : null,
        // Payment schedule milestones
        quote.milestones && quote.milestones.length > 0
          ? React.createElement(
              View,
              { style: styles.milestonesBox },
              React.createElement(Text, { style: styles.milestonesTitle }, "Payment Schedule"),
              ...quote.milestones.map((m, i) =>
                React.createElement(
                  View,
                  { key: String(i), style: styles.milestoneRow },
                  React.createElement(Text, null, m.label),
                  React.createElement(Text, null, `£${fmtGbp(m.amount_pence)}`),
                ),
              ),
            )
          : null,
      ),
    );

    const pdfBuffer = await renderToBuffer(doc);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${quote.quote_number}.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch {
    // Fall back to HTML response the browser can print-to-PDF
    const html = buildHtmlQuote(quote, providerName);
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${quote.quote_number}.html"`,
      },
    });
  }
}

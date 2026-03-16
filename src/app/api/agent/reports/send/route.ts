/**
 * /api/agent/reports/send
 *
 * POST -- Send a generated vendor report to the vendor by email via Resend.
 *
 * Body: { report_id: string; vendor_email: string }
 *
 * TODO: When the property→seller relationship is modelled in the DB, resolve
 * vendor_email automatically from the property_id rather than requiring the
 * caller to supply it.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import type { AgentVendorReport } from "@/types/agent";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const sendReportSchema = z.object({
  report_id: z.string().uuid("report_id must be a valid UUID"),
  vendor_email: z.string().email("vendor_email must be a valid email address"),
});

// ---------------------------------------------------------------------------
// Resend client (lazy, gracefully degraded)
// ---------------------------------------------------------------------------

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[reports/send] RESEND_API_KEY not set — email disabled");
    return null;
  }
  return new Resend(apiKey);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate body
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = sendReportSchema.safeParse(raw);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "Validation failed" },
        { status: 400 },
      );
    }

    const { report_id, vendor_email } = parsed.data;

    // Fetch the report — must belong to the authenticated agent
    const { data: report, error: fetchError } = await supabase
      .from("agent_vendor_reports")
      .select("*")
      .eq("id", report_id)
      .eq("agent_id", user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { error: "Report not found or access denied" },
        { status: 404 },
      );
    }

    const typedReport = report as AgentVendorReport;

    // Send email via Resend (graceful degradation if not configured)
    const resend = getResend();

    if (resend) {
      await resend.emails.send({
        from: "Britestate <noreply@britestate.com>",
        to: vendor_email,
        subject: `Your property report is ready — ${formatReportType(typedReport.report_type)}`,
        html: buildVendorReportEmailHtml(typedReport),
      });
    } else {
      // Development fallback: log instead of failing
      console.info(
        `[reports/send] Email would be sent to ${vendor_email} for report ${report_id}`,
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send report";
    console.error("[reports/send] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatReportType(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildVendorReportEmailHtml(report: AgentVendorReport): string {
  const data = report.data as Record<string, unknown>;
  const reportTypeLabel = formatReportType(report.report_type);

  const metricsRows = [
    ["Total Viewings", String(data.total_viewings ?? "N/A")],
    ["Booked Viewings", String(data.booked_viewings ?? "N/A")],
    ["Total Offers", String(data.total_offers ?? "N/A")],
    [
      "Time on Market",
      data.time_on_market ? `${data.time_on_market} days` : "N/A",
    ],
  ]
    .map(
      ([label, value]) => `
    <tr>
      <td style="padding:8px 16px 8px 0;font-weight:600;vertical-align:top;white-space:nowrap;">${label}:</td>
      <td style="padding:8px 0;">${value}</td>
    </tr>`,
    )
    .join("");

  const pdfSection = report.pdf_url
    ? `<p style="margin:16px 0 0;">
        <a href="${report.pdf_url}"
           style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;">
          Download PDF Report
        </a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;padding:20px;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="display:flex;align-items:center;gap:12px;border-bottom:2px solid #E5E7EB;padding-bottom:16px;margin-bottom:24px;">
      <div style="width:40px;height:40px;border-radius:6px;background:#2563EB;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;">B</div>
      <div>
        <h2 style="margin:0;color:#111827;font-size:18px;">Britestate Agency</h2>
        <p style="margin:0;color:#6B7280;font-size:12px;">Vendor Report</p>
      </div>
    </div>

    <h3 style="margin:0 0 16px;color:#111827;">${reportTypeLabel}</h3>

    <table style="border-collapse:collapse;width:100%;">
      <tr>
        <td style="padding:8px 16px 8px 0;font-weight:600;vertical-align:top;white-space:nowrap;">Property ID:</td>
        <td style="padding:8px 0;">${report.property_id ?? "N/A"}</td>
      </tr>
      <tr>
        <td style="padding:8px 16px 8px 0;font-weight:600;vertical-align:top;white-space:nowrap;">Generated:</td>
        <td style="padding:8px 0;">${formatDate(report.generated_at)}</td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0;">

    <h4 style="margin:0 0 12px;color:#374151;">Performance Metrics</h4>
    <table style="border-collapse:collapse;width:100%;">
      ${metricsRows}
    </table>

    ${pdfSection}

    <p style="margin:24px 0 0;color:#9CA3AF;font-size:12px;border-top:1px solid #E5E7EB;padding-top:16px;">
      Report ID: ${report.id} | Sent by Britestate
    </p>
  </div>
</body>
</html>`;
}

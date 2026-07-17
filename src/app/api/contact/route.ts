/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createRateLimiter } from "@/lib/cache/redis";
import { escapeHtml } from "@/lib/escape-html";
import { createTicket } from "@/services/support/ticket-service";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z
    .string()
    .min(20, "Message must be at least 20 characters")
    .max(2000, "Message must not exceed 2000 characters"),
});

// ---------------------------------------------------------------------------
// Rate limiter: 3 requests per hour per IP
// ---------------------------------------------------------------------------

const contactRateLimiter = createRateLimiter(3, "1 h");

// ---------------------------------------------------------------------------
// Resend client (lazy, gracefully degraded)
// ---------------------------------------------------------------------------

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[contact] RESEND_API_KEY not set -- email disabled");
    return null;
  }
  return new Resend(apiKey);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Rate limit check
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { success: rateLimitOk } = await contactRateLimiter.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 2. Parse and validate body
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { name, email, subject, message } = parsed.data;

  // 3. Log submission (always -- useful for debugging even without email)
  console.info("[contact] Submission from", email, "|", subject);

  // 3a. Persist as a support ticket (best-effort). If persistence fails we STILL
  //     send the email below, so a support request is never lost.
  let reference: string | undefined;
  try {
    const created = await createTicket({
      email,
      name,
      subject,
      body: message,
      correlationId: request.headers.get("x-correlation-id"),
      source: "contact_form",
    });
    reference = created.reference;
  } catch (err) {
    console.error("[contact] Ticket persistence failed (falling back to email-only):", err);
  }

  // 4. Send email via Resend (graceful degradation if not configured)
  const resend = getResend();
  const supportEmail = process.env.SUPPORT_EMAIL ?? "support@truedeed.co.uk";

  if (resend) {
    try {
      await resend.emails.send({
        from: "TrueDeed <noreply@truedeed.co.uk>",
        to: supportEmail,
        replyTo: email,
        subject: `[Contact] ${subject}`,
        html: buildEmailHtml({ name, email, subject, message }),
      });
    } catch (err) {
      console.error("[contact] Failed to send email:", err);
    }
  }

  return NextResponse.json(reference ? { success: true, reference } : { success: true });
}

// ---------------------------------------------------------------------------
// HTML email template
// ---------------------------------------------------------------------------

function buildEmailHtml(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safeSubject = escapeHtml(data.subject);
  const safeMessage = escapeHtml(data.message).replace(/\n/g, "<br>");
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;padding:20px;">
  <h2 style="color:#1B4D3E;">New contact form submission</h2>
  <table style="border-collapse:collapse;width:100%;max-width:600px;">
    <tr>
      <td style="padding:8px 16px 8px 0;font-weight:600;vertical-align:top;white-space:nowrap;">Name:</td>
      <td style="padding:8px 0;">${safeName}</td>
    </tr>
    <tr>
      <td style="padding:8px 16px 8px 0;font-weight:600;vertical-align:top;white-space:nowrap;">Email:</td>
      <td style="padding:8px 0;"><a href="mailto:${encodeURIComponent(data.email)}">${safeEmail}</a></td>
    </tr>
    <tr>
      <td style="padding:8px 16px 8px 0;font-weight:600;vertical-align:top;white-space:nowrap;">Subject:</td>
      <td style="padding:8px 0;">${safeSubject}</td>
    </tr>
  </table>
  <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
  <p style="margin:0;line-height:1.6;">${safeMessage}</p>
</body>
</html>`;
}

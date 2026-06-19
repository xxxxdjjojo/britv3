import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { Resend } from "resend";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { brandConfig } from "@/config/brand";

// Zod schema — mirrors GdprRequestForm fields
const GdprRequestSchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email(),
  accountEmail: z.string().email().optional(),
  rightType: z.enum([
    "Access",
    "Erasure",
    "Portability",
    "Rectification",
    "Restriction",
    "Objection",
    "Withdraw Consent",
    "Lodge Complaint",
  ]),
  description: z.string().min(20).max(1000),
});

const redis = Redis.fromEnv();

// Primary: 3 requests per email per 30 days
const emailRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "30 d"),
  prefix: "rl:gdpr:email",
});

// Secondary: 10 requests per IP per day
const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 d"),
  prefix: "rl:gdpr:ip",
});

function generateReference(): string {
  const date = new Date();
  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `SAR-${yyyymmdd}-${nanoid(6)}`;
}

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Parse JSON
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate
  const parsed = GdprRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fullName, email, accountEmail, rightType, description } = parsed.data;

  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success: ipOk } = await ipRatelimit.limit(ip);
  if (!ipOk) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Rate limit by email
  const { success: emailOk } = await emailRatelimit.limit(email.toLowerCase());
  if (!emailOk) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const reference = generateReference();
  const submittedAt = new Date().toUTCString();

  // Send admin notification
  await resend.emails.send({
    from: `${brandConfig.displayName} Privacy <${brandConfig.emails.privacy}>`,
    to: brandConfig.emails.privacy,
    subject: `[SAR] ${rightType} request — ${reference}`,
    text: [
      `Reference: ${reference}`,
      `Submitted: ${submittedAt}`,
      `Right Type: ${rightType}`,
      `Full Name: ${fullName}`,
      `Contact Email: ${email}`,
      accountEmail ? `Account Email: ${accountEmail}` : "",
      "",
      `Description:`,
      description,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  // Send confirmation to requester
  await resend.emails.send({
    from: `${brandConfig.displayName} Privacy <${brandConfig.emails.privacy}>`,
    to: email,
    subject: `Your data subject request — ${reference}`,
    text: [
      `Dear ${fullName},`,
      "",
      `We have received your ${rightType} request.`,
      "",
      `Your reference number is: ${reference}`,
      "",
      "We will respond within 30 calendar days. In complex cases we may extend by up to 2 months and will notify you.",
      "",
      `If you have any questions, reply to this email or contact ${brandConfig.emails.privacy}.`,
      "",
      `${brandConfig.displayName} Privacy Team`,
    ].join("\n"),
  });

  return NextResponse.json({ success: true, reference }, { status: 200 });
}

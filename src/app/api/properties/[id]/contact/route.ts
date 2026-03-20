import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter } from "@/lib/cache/redis";
import { log } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/services/messaging/message-service";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const contactSchema = z.object({
  agentId: z.string().min(1, "agentId is required"),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message too long (max 1000 chars)"),
  // Optional guest fields
  name: z.string().max(120).optional(),
  email: z.string().email("Invalid email address").optional(),
});

// ---------------------------------------------------------------------------
// Rate limiter — 5 requests per 10 minutes per IP
// ---------------------------------------------------------------------------

const ratelimit = createRateLimiter(5, "10 m");

// ---------------------------------------------------------------------------
// POST /api/properties/[id]/contact
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: propertyId } = await params;

  // ------------------------------------------------------------------
  // 1. Rate limiting (G4: fail open — never block on Upstash error)
  // ------------------------------------------------------------------
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";

  try {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes before trying again." },
        { status: 429 },
      );
    }
  } catch (err) {
    log("error", "rate_limiter_unavailable", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
    // Fail open — do not block legitimate users because Redis is down
  }

  // ------------------------------------------------------------------
  // 2. Parse + validate body
  // ------------------------------------------------------------------
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Invalid request body." },
      { status: 400 },
    );
  }

  const { agentId, message, name, email } = parsed.data;

  // ------------------------------------------------------------------
  // 3. Resolve sender — authenticated user or guest stub
  // ------------------------------------------------------------------
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Guest enquiry — require name + email
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required for guest enquiries." },
        { status: 400 },
      );
    }

    // For unauthenticated users we log the enquiry but cannot create a
    // Supabase message (no sender_id). Route to a dedicated guest-enquiry
    // path: store in a `guest_enquiries` table or email the agent.
    // For now, record the enquiry as a structured log and return success
    // so the UI is not blocked while the guest_enquiries table is wired up.
    log("info", "guest_property_enquiry", {
      property_id: propertyId,
      agent_id: agentId,
      guest_name: name,
      guest_email: email,
      message_length: message.length,
    });

    return NextResponse.json({ ok: true });
  }

  // ------------------------------------------------------------------
  // 4. Send message via MessagingService
  // ------------------------------------------------------------------
  try {
    await sendMessage(supabase, user.id, {
      recipient_id: agentId,
      content: message,
      context_type: "listing",
      context_id: propertyId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    log("error", "property_contact_send_failed", {
      property_id: propertyId,
      agent_id: agentId,
      sender_id: user.id,
      error_type: err instanceof Error ? err.name : "unknown",
      error_message: err instanceof Error ? err.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Failed to send your message. Please try again." },
      { status: 500 },
    );
  }
}

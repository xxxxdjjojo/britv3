/**
 * Truedeed capture hook for the message-send path (design §5).
 *
 * Lives at the API-route layer (not inside message-service) because the
 * messaging service runs with the caller's user-scoped client and is shared
 * by multiple send paths — including /api/properties/[id]/contact, which has
 * its own 'enquiry' hook and must not double-capture. This helper runs
 * server-side only, with the service-role client.
 *
 * Fire-and-forget: never throws, never blocks the host action. Logs error
 * types only — no PII.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  recordIntroduction,
  recordIntroductionEvent,
} from "@/services/truedeed/introduction-service";

type CaptureInput = {
  senderId: string;
  contextType?: string;
  contextId?: string | null;
  conversationId?: string;
};

export async function captureListingMessageIntroduction(
  input: CaptureInput,
): Promise<void> {
  try {
    const admin = createAdminClient();

    let contextType = input.contextType ?? null;
    let contextId = input.contextId ?? null;

    // Replies into an existing conversation may not carry the context —
    // resolve it from the conversation row.
    if ((!contextType || !contextId) && input.conversationId) {
      const { data: conversation } = await admin
        .from("conversations")
        .select("context_type, context_id")
        .eq("id", input.conversationId)
        .maybeSingle();
      contextType = (conversation?.context_type as string | null) ?? contextType;
      contextId = (conversation?.context_id as string | null) ?? contextId;
    }

    if (contextType !== "listing" || !contextId) return;

    // The listing's own agent messaging an applicant is not an introduction.
    const { data: listing } = await admin
      .from("listings")
      .select("user_id")
      .eq("id", contextId)
      .maybeSingle();
    if (!listing || listing.user_id === input.senderId) return;

    await recordIntroduction({
      applicantId: input.senderId,
      listingId: contextId,
      contactType: "message",
    });
    await recordIntroductionEvent({
      applicantId: input.senderId,
      listingId: contextId,
      eventType: "message_sent",
    });
  } catch (err) {
    console.warn("[truedeed] message introduction capture failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
  }
}

// Server-side analytics event logging for the New Homes funnel. Events are
// written with the service-role client (RLS write is locked to members only;
// these are system-generated). This is the single source for the pilot metrics
// that feed the conversion dashboard.

import { createAdminClient } from "@/lib/supabase/admin";
import type { DevelopmentEventType } from "@/lib/new-homes/types";

export interface LogEventInput {
  eventType: DevelopmentEventType;
  developmentId?: string | null;
  unitId?: string | null;
  leadId?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Record a development funnel event. Never throws — analytics must not break a
 * user-facing request; failures are logged and swallowed.
 */
export async function logDevelopmentEvent(input: LogEventInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("development_events").insert({
      event_type: input.eventType,
      development_id: input.developmentId ?? null,
      unit_id: input.unitId ?? null,
      lead_id: input.leadId ?? null,
      session_id: input.sessionId ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) {
      // eslint-disable-next-line no-console -- analytics failures are non-fatal
      console.warn("[new-homes] failed to log event", input.eventType, error.message);
    }
  } catch (err) {
    // eslint-disable-next-line no-console -- analytics failures are non-fatal
    console.warn("[new-homes] event logging threw", err);
  }
}

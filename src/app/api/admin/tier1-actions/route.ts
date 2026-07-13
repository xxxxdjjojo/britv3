/**
 * POST /api/admin/tier1-actions
 *
 * Dispatch endpoint for the Tier-1 audited action registry (production-support
 * PR 8). Two modes:
 *   - preview: read-only dry run (powers Recommend mode) — permission-gated,
 *     NOT audited (no side effect).
 *   - execute: performs the side effect — permission-gated AND audited
 *     (success and failure) via the standard admin-audit path.
 *
 * Security invariants:
 *   - Each action declares its own `requiredPermission`; execute is gated on it.
 *   - Actions run with the service-role client but never return secrets/links.
 *   - The audit record carries only the action key + target — no metadata that
 *     could leak a token or reset link.
 */

import { z } from "zod";
import {
  adminWithPermission,
} from "@/lib/admin-guard";
import {
  auditedAdminActionWithPermission,
  AdminActionError,
} from "@/lib/audited-admin-action";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { captureException } from "@/lib/observability/capture-exception";
import { getTier1Action } from "@/services/admin/tier1-actions/registry";
import {
  Tier1ActionError,
  type Tier1ActionContext,
} from "@/services/admin/tier1-actions/types";

const bodySchema = z.object({
  actionKey: z.string().min(1),
  targetId: z.string().min(1),
  mode: z.enum(["preview", "execute"]),
  // Plain string, not z.string().uuid(): Zod's strict UUID validator rejects
  // some valid Postgres UUIDs (documented gotcha). ticketId only routes a
  // best-effort system note, so a malformed value fails harmlessly.
  ticketId: z.string().min(1).optional(),
});

function makeContext(targetId: string, actorId: string): Tier1ActionContext {
  return {
    supabase: createAdminClient(),
    getStripe,
    targetId,
    actorId,
  };
}

/** Append a non-sensitive system note to a ticket thread (best-effort). */
async function appendTicketSystemNote(
  ticketId: string,
  actorId: string,
  body: string,
): Promise<void> {
  try {
    await createAdminClient()
      .from("support_ticket_messages")
      .insert({
        ticket_id: ticketId,
        author_type: "system",
        author_id: actorId,
        body,
        internal_note: true,
      });
  } catch (err) {
    captureException(err, {
      module: "admin",
      feature: "tier1-actions",
      operation: "appendTicketSystemNote",
      extra: { ticketId },
    });
  }
}

export async function POST(req: Request): Promise<Response> {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const action = getTier1Action(parsed.actionKey);
  if (!action) {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  if (parsed.mode === "preview") {
    const ctx = await adminWithPermission(req, action.requiredPermission);
    if (ctx instanceof Response) return ctx;
    try {
      const preview = await action.preview(makeContext(parsed.targetId, ctx.user.id));
      return Response.json({ preview });
    } catch (err) {
      const status = err instanceof Tier1ActionError ? err.status : 500;
      const message = err instanceof Error ? err.message : "Preview failed";
      return Response.json({ error: message }, { status });
    }
  }

  return auditedAdminActionWithPermission(
    req,
    `tier1.${action.key}`,
    action.targetType,
    parsed.targetId,
    action.requiredPermission,
    async ({ user }) => {
      let result;
      try {
        result = await action.execute(makeContext(parsed.targetId, user.id));
      } catch (err) {
        if (err instanceof Tier1ActionError) {
          throw new AdminActionError(err.message, err.status);
        }
        throw err;
      }

      if (parsed.ticketId) {
        await appendTicketSystemNote(
          parsed.ticketId,
          user.id,
          `[Tier-1 action] ${action.label}: ${result.summary}`,
        );
      }

      return result;
    },
  );
}

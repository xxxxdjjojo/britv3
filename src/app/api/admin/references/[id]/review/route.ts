import { z } from "zod";
import {
  auditedAdminActionWithPermission,
  AdminActionError,
} from "@/lib/audited-admin-action";
import { logAdminAction } from "@/lib/admin-audit";
import { reviewReference } from "@/services/admin/verification-service";

const bodySchema = z.object({
  decision: z.enum(["verify", "reject", "flag"]),
  reason: z.string().min(1).optional(),
});

// The service returns a `code` on failure; map each to the right HTTP status.
const CODE_STATUS: Record<string, number> = {
  reason_required: 400,
  invalid_state: 409,
  not_found: 404,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Reject a malformed id before touching the body or the service so a bad path
  // segment can't reach the DB layer. Generic 404 — don't leak the shape.
  if (!z.string().uuid().safeParse(id).success) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(
    req,
    "reference.review",
    "provider_reference",
    id,
    "manage_verifications",
    async (ctx) => {
      const result = await reviewReference(ctx.supabase, {
        referenceId: id,
        decision: parsed.decision,
        reason: parsed.reason,
        adminId: ctx.user.id,
      });

      if (!result.success) {
        const status = (result.code && CODE_STATUS[result.code]) ?? 400;
        // AdminActionError is surfaced verbatim by the wrapper with this status.
        throw new AdminActionError(result.error, status);
      }

      // The wrapper auto-logs a metadata-less base entry. Log an explicit entry
      // carrying the decision + reason so the record of record includes them
      // (the wrapper omits metadata). This intentionally double-logs; a
      // metadata-bearing log is more valuable than the bare one. Best-effort:
      // the decision already succeeded, so a metadata-log failure must not 500.
      try {
        await logAdminAction(ctx.supabase, {
          adminId: ctx.user.id,
          action: "reference.review",
          targetType: "provider_reference",
          targetId: id,
          metadata: { decision: parsed.decision, reason: parsed.reason ?? null },
        });
      } catch (logError) {
        console.warn("reference.review metadata audit log failed", logError);
      }

      return { success: true };
    },
  );
}

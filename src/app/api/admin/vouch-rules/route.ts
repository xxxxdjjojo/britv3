import { z } from "zod";
import {
  auditedAdminActionWithPermission,
  AdminActionError,
} from "@/lib/audited-admin-action";
import { logAdminAction } from "@/lib/admin-audit";

// All fields optional (partial update). Counts are non-negative ints; day/hour
// windows must be strictly positive so a rule never divides against a zero span.
const bodySchema = z
  .object({
    required_peer_vouches: z.number().int().min(0),
    required_client_vouches: z.number().int().min(0),
    client_recency_days: z.number().int().positive(),
    invite_expiry_days: z.number().int().positive(),
    resend_cooldown_hours: z.number().int().min(0),
    gate_enabled: z.boolean(),
  })
  .partial();

export async function PUT(req: Request) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (Object.keys(parsed).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(
    req,
    "vouch_rules.update",
    "verification_vouch_rules",
    "singleton",
    "manage_verifications",
    async (ctx) => {
      const { data, error } = await ctx.supabase
        .from("verification_vouch_rules")
        .update({ ...parsed, updated_by: ctx.user.id })
        .eq("id", true)
        .select("*")
        .maybeSingle();

      if (error || !data) {
        throw new AdminActionError("Failed to update vouch rules", 500);
      }

      // Explicit metadata log — the wrapper's auto-log omits metadata. Records
      // which fields changed. Best-effort: the update already committed, so a
      // metadata-log failure must not 500 a successful save.
      try {
        await logAdminAction(ctx.supabase, {
          adminId: ctx.user.id,
          action: "vouch_rules.update",
          targetType: "verification_vouch_rules",
          targetId: "singleton",
          metadata: { changed: parsed },
        });
      } catch (logError) {
        console.warn("vouch_rules.update metadata audit log failed", logError);
      }

      return { rules: data };
    },
  );
}

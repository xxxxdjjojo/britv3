import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { setRollout } from "@/services/admin/feature-flag-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  return auditedAdminActionWithPermission(
    req,
    "feature_flag.rollout",
    "feature_flag",
    key,
    "manage_feature_flags",
    async ({ supabase, user }) => {
      const body = await req.json().catch(() => ({})) as { pct?: number };
      if (typeof body.pct !== "number") {
        throw new Error("pct (number) is required");
      }
      const result = await setRollout(supabase, key, body.pct, user.id);
      if (!result.success) throw new Error(result.error ?? "Failed to set rollout");
      return { success: true, key, rollout_pct: body.pct };
    },
  );
}

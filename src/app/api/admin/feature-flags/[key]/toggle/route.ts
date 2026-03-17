import { auditedAdminAction } from "@/lib/audited-admin-action";
import { toggleFlag } from "@/services/admin/feature-flag-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  return auditedAdminAction(
    req,
    "feature_flag.toggle",
    "feature_flag",
    key,
    async ({ supabase, user }) => {
      const body = await req.json().catch(() => ({})) as { enabled?: boolean };
      if (typeof body.enabled !== "boolean") {
        throw new Error("enabled (boolean) is required");
      }
      const result = await toggleFlag(supabase, key, body.enabled, user.id);
      if (!result.success) throw new Error("Failed to toggle feature flag");
      return { success: true, key, enabled: body.enabled };
    },
  );
}

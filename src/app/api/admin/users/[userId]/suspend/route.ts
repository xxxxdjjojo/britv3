import { auditedAdminAction } from "@/lib/audited-admin-action";
import { suspendUser, type SuspendDuration } from "@/services/admin/user-service";

const VALID_DURATIONS: SuspendDuration[] = ["24h", "7d", "30d", "indefinite"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const body = await req.json().catch(() => ({})) as { duration?: string };
  const duration = VALID_DURATIONS.includes(body.duration as SuspendDuration)
    ? (body.duration as SuspendDuration)
    : "indefinite";

  return auditedAdminAction(req, "user.suspend", "user", userId, async ({ supabase }) => {
    const result = await suspendUser(supabase, userId, duration);
    if (!result.success) throw new Error("Failed to suspend user");
    return { success: true, duration };
  });
}

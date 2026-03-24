import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { activateUser } from "@/services/admin/user-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return auditedAdminActionWithPermission(
    req,
    "user.activate",
    "user",
    userId,
    "suspend_users",
    async ({ supabase }) => {
      const result = await activateUser(supabase, userId);
      if (!result.success) throw new Error("Failed to activate user");
      return { success: true };
    },
  );
}

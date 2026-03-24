import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { promoteToAdmin } from "@/services/admin/user-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return auditedAdminActionWithPermission(
    req,
    "user.promote_to_admin",
    "user",
    userId,
    "manage_roles",
    async ({ supabase }) => {
      const result = await promoteToAdmin(supabase, userId);
      if (!result.success) throw new Error("Failed to promote user");
      return { success: true };
    },
  );
}

import { auditedAdminAction } from "@/lib/audited-admin-action";
import { suspendUser } from "@/services/admin-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return auditedAdminAction(
    req,
    "user.suspend",
    "user",
    userId,
    async ({ supabase }) => {
      const result = await suspendUser(supabase, userId);
      if (!result.success) throw new Error("Failed to suspend user");
      return { success: true };
    },
  );
}

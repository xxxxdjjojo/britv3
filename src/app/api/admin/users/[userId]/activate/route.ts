import { auditedAdminAction } from "@/lib/audited-admin-action";
import { activateUser } from "@/services/admin-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return auditedAdminAction(
    req,
    "user.activate",
    "user",
    userId,
    async ({ supabase }) => {
      const result = await activateUser(supabase, userId);
      if (!result.success) throw new Error("Failed to activate user");
      return { success: true };
    },
  );
}

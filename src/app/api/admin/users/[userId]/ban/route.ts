import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { banUser } from "@/services/admin/user-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  let body: { reason: string };
  try {
    body = (await req.json()) as { reason: string };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.reason) {
    return Response.json({ error: "reason is required" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(req, "user.ban", "user", userId, "ban_users", async ({ supabase }) => {
    const result = await banUser(supabase, userId, body.reason);
    if (!result.success) throw new Error("Failed to ban user");
    return { success: true };
  });
}

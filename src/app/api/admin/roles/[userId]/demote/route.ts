import { AdminActionError, auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { demoteFromAdmin } from "@/services/admin/user-service";

const VALID_ROLES = [
  "homebuyer", "renter", "seller", "landlord", "estate_agent", "service_provider",
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return auditedAdminActionWithPermission(
    req,
    "user.demote_from_admin",
    "user",
    userId,
    "manage_roles",
    async ({ supabase, user }) => {
      if (userId === user.id) {
        throw new AdminActionError("Cannot demote yourself", 403);
      }

      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_admin", true);

      if ((count ?? 0) <= 1) {
        throw new AdminActionError("Cannot remove the last admin", 409);
      }

      const body = await req.json().catch(() => ({})) as { role?: string };
      const newRole = body.role ?? "homebuyer";
      if (!VALID_ROLES.includes(newRole)) {
        throw new Error(`Invalid role: ${newRole}`);
      }
      const result = await demoteFromAdmin(supabase, userId);
      if (!result.success) throw new Error("Failed to demote user");
      return { success: true };
    },
  );
}

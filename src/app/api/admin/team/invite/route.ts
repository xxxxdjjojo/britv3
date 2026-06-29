import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { ADMIN_ROLES, type AdminRole } from "@/lib/admin-permissions";
import { createAdminClient } from "@/lib/supabase/admin";

function parseAdminRole(value: unknown): AdminRole {
  if (value === undefined || value === null || value === "") {
    return "moderation_admin";
  }

  if (typeof value === "string" && ADMIN_ROLES.includes(value as AdminRole)) {
    return value as AdminRole;
  }

  throw new Error("adminRole is invalid");
}

export async function POST(req: Request) {
  return auditedAdminActionWithPermission(
    req,
    "team.invite",
    "user",
    "invite",
    "manage_team",
    async () => {
      const body = await req.json().catch(() => ({})) as {
        email?: unknown;
        adminRole?: unknown;
      };
      if (!body.email || typeof body.email !== "string") {
        throw new Error("email is required");
      }

      const email = body.email.trim();
      if (!email) {
        throw new Error("email is required");
      }
      const adminRole = parseAdminRole(body.adminRole);

      const adminClient = createAdminClient();
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
        email,
        {
          data: { role: "admin", admin_role: adminRole },
        },
      );

      if (error) throw new Error(error.message);
      if (!data.user?.id) {
        throw new Error("invited user was not returned");
      }

      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ is_admin: true, admin_role: adminRole })
        .eq("id", data.user.id);

      if (profileError) throw new Error(profileError.message);

      return { invited: true, email: data.user.email, adminRole };
    },
  );
}

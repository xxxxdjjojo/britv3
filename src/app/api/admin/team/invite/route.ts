import { auditedAdminAction } from "@/lib/audited-admin-action";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  return auditedAdminAction(
    req,
    "team.invite",
    "user",
    "invite",
    async () => {
      const body = await req.json().catch(() => ({})) as { email?: string };
      if (!body.email || typeof body.email !== "string") {
        throw new Error("email is required");
      }

      const adminClient = createAdminClient();
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
        body.email,
        {
          data: { role: "admin" },
        },
      );

      if (error) throw new Error(error.message);
      return { invited: true, email: data.user.email };
    },
  );
}

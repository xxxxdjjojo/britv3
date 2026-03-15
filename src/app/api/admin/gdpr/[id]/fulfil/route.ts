import { auditedAdminAction } from "@/lib/audited-admin-action";
import { fulfilGdprRequest } from "@/services/admin/gdpr-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return auditedAdminAction(
    req,
    "gdpr.fulfil",
    "gdpr_request",
    id,
    async ({ supabase, user }) => {
      const result = await fulfilGdprRequest(supabase, id, user.id);
      if (result.alreadyFulfilled) {
        return Response.json(
          { message: "Request already fulfilled or in progress" },
          { status: 409 },
        );
      }
      if (!result.accepted) throw new Error("Failed to accept GDPR request");
      return { accepted: true, requestId: id };
    },
  );
}

import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { reviewVerification } from "@/services/admin/verification-service";

export async function POST(req: Request) {
  let body: {
    userId: string;
    decision: "approved" | "rejected";
    notes?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.userId || !body.decision) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["approved", "rejected"].includes(body.decision)) {
    return Response.json({ error: "Invalid decision value" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(
    req,
    "verification.review",
    "user",
    body.userId,
    "manage_verifications",
    async ({ supabase }) => {
      const result = await reviewVerification(
        supabase,
        body.userId,
        body.decision,
        body.notes,
      );
      if (!result.success) throw new Error("Failed to review verification");
      return { success: true };
    },
  );
}

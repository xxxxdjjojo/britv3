import { auditedAdminAction } from "@/lib/audited-admin-action";
import { reviewVerification } from "@/services/admin-service";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    userId: string;
    decision: "approved" | "rejected";
    notes?: string;
  };

  if (!body.userId || !body.decision) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  return auditedAdminAction(
    req,
    "verification.review",
    "user",
    body.userId,
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

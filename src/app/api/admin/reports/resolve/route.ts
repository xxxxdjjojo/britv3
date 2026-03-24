import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { resolveReport } from "@/services/admin/review-service";

export async function POST(req: Request) {
  let body: {
    reportId: string;
    resolution: "resolved" | "dismissed";
    note?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.reportId || !body.resolution) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["resolved", "dismissed"].includes(body.resolution)) {
    return Response.json({ error: "Invalid resolution value" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(
    req,
    "report.resolve",
    "report",
    body.reportId,
    "moderate_content",
    async ({ supabase, user }) => {
      const result = await resolveReport(
        supabase,
        body.reportId,
        body.resolution,
        body.note,
        user.id,
      );
      if (!result.success) throw new Error("Failed to resolve report");
      return { success: true };
    },
  );
}

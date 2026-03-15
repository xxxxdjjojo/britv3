import { auditedAdminAction } from "@/lib/audited-admin-action";
import { resolveReport } from "@/services/admin-service";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    reportId: string;
    resolution: "resolved" | "dismissed";
    note?: string;
  };

  if (!body.reportId || !body.resolution) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  return auditedAdminAction(
    req,
    "report.resolve",
    "report",
    body.reportId,
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

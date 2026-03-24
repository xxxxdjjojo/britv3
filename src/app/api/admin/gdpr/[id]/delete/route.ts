import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { deleteUserData } from "@/services/admin/gdpr-fulfillment-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return auditedAdminActionWithPermission(
    req,
    "gdpr.delete",
    "gdpr_request",
    id,
    "manage_gdpr",
    async ({ supabase }) => {
      const { data: gdprRequest } = await supabase
        .from("gdpr_requests")
        .select("user_id, status, request_type")
        .eq("id", id)
        .single();

      if (!gdprRequest) throw new Error("GDPR request not found");
      if (gdprRequest.request_type !== "deletion") {
        throw new Error("This request is not a deletion request");
      }
      if (gdprRequest.status === "fulfilled") {
        return { error: "Already fulfilled", alreadyFulfilled: true };
      }

      const result = await deleteUserData(gdprRequest.user_id);

      const newStatus = result.deleted ? "fulfilled" : "failed";
      await supabase
        .from("gdpr_requests")
        .update({
          status: newStatus,
          fulfilled_at: new Date().toISOString(),
          notes: result.details.join("; "),
        })
        .eq("id", id);

      return { ...result, requestId: id };
    },
  );
}

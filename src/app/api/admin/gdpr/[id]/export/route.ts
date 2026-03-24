import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { aggregateUserData } from "@/services/admin/gdpr-fulfillment-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return auditedAdminActionWithPermission(
    req,
    "gdpr.export",
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
      if (gdprRequest.status === "fulfilled") {
        return { error: "Already fulfilled", alreadyFulfilled: true };
      }

      const exportData = await aggregateUserData(gdprRequest.user_id);

      // Store export as JSON in Supabase Storage
      const fileName = `gdpr-exports/${gdprRequest.user_id}/${id}.json`;
      const { error: uploadError } = await supabase.storage
        .from("admin")
        .upload(fileName, JSON.stringify(exportData, null, 2), {
          contentType: "application/json",
          upsert: true,
        });

      if (uploadError) throw new Error(`Export upload failed: ${uploadError.message}`);

      const { data: signedUrl } = await supabase.storage
        .from("admin")
        .createSignedUrl(fileName, 7 * 24 * 60 * 60);

      await supabase
        .from("gdpr_requests")
        .update({
          status: "fulfilled",
          export_url: signedUrl?.signedUrl ?? null,
          export_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          fulfilled_at: new Date().toISOString(),
        })
        .eq("id", id);

      return { fulfilled: true, exportUrl: signedUrl?.signedUrl };
    },
  );
}

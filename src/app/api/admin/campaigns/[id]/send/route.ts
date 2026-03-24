import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return auditedAdminActionWithPermission(
    req,
    "campaign.send",
    "email_campaign",
    id,
    "send_campaigns",
    async ({ supabase }) => {
      const { error } = await supabase
        .from("email_campaigns")
        .update({
          status: "scheduled",
          scheduled_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw new Error(error.message);
      return { queued: true, campaignId: id };
    },
  );
}

import { auditedAdminAction } from "@/lib/audited-admin-action";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return auditedAdminAction(
    req,
    "campaign.send",
    "email_campaign",
    id,
    async ({ supabase }) => {
      const { error } = await supabase
        .from("email_campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw new Error(error.message);
      return { sent: true, campaignId: id };
    },
  );
}

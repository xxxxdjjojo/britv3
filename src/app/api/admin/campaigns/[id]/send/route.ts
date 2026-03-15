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
      // NOTE: Setting status to 'scheduled' queues the campaign for dispatch.
      // A Supabase Edge Function (campaign-sender) reads records in this state
      // and dispatches emails via Resend. The Edge Function is defined separately
      // and not yet deployed. Do not set status to 'sent' here — the Edge Function
      // updates it to 'sent' after successful dispatch.
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

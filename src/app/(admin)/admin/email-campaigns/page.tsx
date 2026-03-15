import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmailCampaignsClient } from "@/components/admin/EmailCampaignsClient";

export default async function AdminEmailCampaignsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("email_campaigns")
    .select(
      "id, name, subject, status, recipient_count, scheduled_at, created_at",
    )
    .order("created_at", { ascending: false });

  const campaigns = data ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Email Campaigns"
        description="Create and send email campaigns to your users."
      />
      <EmailCampaignsClient campaigns={campaigns} />
    </div>
  );
}

import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const EmailCampaignsClient = dynamic(
  () => import("@/components/admin/EmailCampaignsClient").then((mod) => mod.EmailCampaignsClient),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

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

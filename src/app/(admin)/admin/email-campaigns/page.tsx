import { Suspense } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Skeleton } from "@/components/ui/skeleton";

const EmailCampaignsClient = dynamic(
  () => import("@/components/admin/EmailCampaignsClient").then((mod) => mod.EmailCampaignsClient),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
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

export default function AdminEmailCampaignsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

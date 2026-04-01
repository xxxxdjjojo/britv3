import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFeedIntegrations } from "@/services/agent/agent-feed-service";
import { FeedIntegrationConfig } from "@/components/dashboard/agent/integrations/FeedIntegrationConfig";
import { Skeleton } from "@/components/ui/skeleton";


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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let initialIntegrations: Awaited<ReturnType<typeof getFeedIntegrations>> = [];

  try {
    initialIntegrations = await getFeedIntegrations(supabase, user.id);
  } catch {
    // Table may not exist in dev — render empty state gracefully
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-on-surface dark:text-gray-100">
          Property Feed Integrations
        </h1>
        <p className="mt-1 text-sm text-[--color-on-surface-variant] dark:text-gray-400">
          Sync listings from Reapit, Alto, or Jupix directly into your Britestate account.
        </p>
      </div>
      <FeedIntegrationConfig initialIntegrations={initialIntegrations} />
    </div>
  );
}

export default function AgentFeedsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

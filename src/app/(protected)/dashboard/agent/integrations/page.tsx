import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getApiKeys } from "@/services/agent/agent-billing-service";
import { ApiKeyManager } from "@/components/dashboard/agent/integrations/ApiKeyManager";
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

  let initialKeys: Awaited<ReturnType<typeof getApiKeys>> = [];

  try {
    initialKeys = await getApiKeys(supabase, user.id);
  } catch {
    // Table may not exist in dev — render empty state gracefully
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface dark:text-neutral-100">Integrations</h1>
        <p className="mt-1 text-sm text-[--color-on-surface-variant] dark:text-neutral-400">
          Connect Britestate to external tools with API keys and manage property feed sync.
        </p>
      </div>
      <ApiKeyManager initialKeys={initialKeys} />
    </div>
  );
}

export default function AgentIntegrationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

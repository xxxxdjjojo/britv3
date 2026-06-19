import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getApiKeys } from "@/services/agent/agent-billing-service";
import { ApiKeyManager } from "@/components/dashboard/agent/integrations/ApiKeyManager";

export default async function AgentIntegrationsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Connect TrueDeed to external tools with API keys and manage property feed sync.
        </p>
      </div>
      <ApiKeyManager initialKeys={initialKeys} />
    </div>
  );
}

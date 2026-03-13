import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getApiKeys } from "@/services/agent/agent-billing-service";
import { ApiKeyManager } from "@/components/dashboard/agent/integrations/ApiKeyManager";

export default async function AgentIntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let apiKeys: Awaited<ReturnType<typeof getApiKeys>> = [];
  try {
    apiKeys = await getApiKeys(supabase, user.id);
  } catch {
    apiKeys = [];
  }

  return <ApiKeyManager initialKeys={apiKeys} />;
}

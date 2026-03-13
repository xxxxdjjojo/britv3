import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFeedIntegrations } from "@/services/agent/agent-feed-service";
import { FeedIntegrationConfig } from "@/components/dashboard/agent/integrations/FeedIntegrationConfig";
import type { AgentFeedIntegration } from "@/types/agent";

export default async function AgentFeedsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let integrations: AgentFeedIntegration[] = [];
  try {
    integrations = await getFeedIntegrations(supabase, user.id);
  } catch {
    integrations = [];
  }

  return <FeedIntegrationConfig initialIntegrations={integrations} />;
}

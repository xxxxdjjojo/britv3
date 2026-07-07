import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { captureException } from "@/lib/observability/capture-exception";
import { getFeedIntegrations } from "@/services/agent/agent-feed-service";
import { FeedIntegrationConfig } from "@/components/dashboard/agent/integrations/FeedIntegrationConfig";

export default async function AgentFeedsPage() {
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
  } catch (error) {
    captureException(error, {
      module: "dashboard",
      feature: "agent",
      route: "/dashboard/agent/integrations/feeds",
      operation: "getFeedIntegrations",
    });
    // Table may not exist in dev — render empty state gracefully
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Property Feed Integrations
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Import your authorised portfolio via supported sources (Reapit sandbox demo) or CSV upload. Alto and Jupix connectors are planned for a future release.
        </p>
      </div>
      <FeedIntegrationConfig initialIntegrations={initialIntegrations} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentViewingSlots } from "@/services/agent/agent-viewing-service";
import { ViewingCalendar } from "@/components/dashboard/agent/viewings/ViewingCalendar";

export default async function AgentViewingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch viewing slots for the current month
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

  let slots: Awaited<ReturnType<typeof getAgentViewingSlots>> = [];

  try {
    slots = await getAgentViewingSlots(supabase, user.id, undefined, { start, end });
  } catch {
    // Graceful fallback: table may not exist in current environment
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Viewings Calendar</h1>
        <p className="text-muted-foreground">
          Manage your viewing schedule and publish availability for buyers
        </p>
      </div>
      <ViewingCalendar initialSlots={slots} agentId={user.id} />
    </div>
  );
}

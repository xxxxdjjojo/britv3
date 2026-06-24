import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentViewingSlots } from "@/services/agent/agent-viewing-service";
import { ViewingCalendar } from "@/components/dashboard/agent/viewings/ViewingCalendar";

export const metadata = {
  title: "Viewing Calendar - Agent Dashboard",
  description: "Manage and schedule property viewings",
};

export default async function AgentViewingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const start = new Date();
  start.setDate(1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const slots = await getAgentViewingSlots(supabase, user.id, undefined, {
    start: start.toISOString(),
    end: end.toISOString(),
  }).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Viewing Calendar</h1>
        <p className="text-muted-foreground">
          Schedule and manage property viewing slots
        </p>
      </div>
      <ViewingCalendar initialSlots={slots} />
    </div>
  );
}

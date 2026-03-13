import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentViewingSlots } from "@/services/agent/agent-viewing-service";
import { ViewingCalendar } from "@/components/dashboard/agent/viewings/ViewingCalendar";
import type { AgentViewingSlot } from "@/types/agent";

export default async function ViewingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch viewing slots for current month (±7 days buffer)
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setDate(start.getDate() - 7);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setDate(end.getDate() + 7);

  let slots: AgentViewingSlot[] = [];
  try {
    slots = await getAgentViewingSlots(supabase, user.id, undefined, {
      start: start.toISOString(),
      end: end.toISOString(),
    });
  } catch {
    slots = [];
  }

  return <ViewingCalendar initialSlots={slots} />;
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentViewingSlots } from "@/services/agent/agent-viewing-service";
import { getPendingViewingRequests } from "@/services/viewings/viewings-service";
import { ViewingCalendar } from "@/components/dashboard/agent/viewings/ViewingCalendar";
import { ViewingRequestsPanel } from "@/components/dashboard/viewings/ViewingRequestsPanel";

export const metadata = {
  title: "Viewings - Landlord Dashboard",
  description: "Manage viewing availability and requests for your rentals",
};

export default async function LandlordViewingsPage() {
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

  const [slots, requests] = await Promise.all([
    getAgentViewingSlots(supabase, user.id, undefined, {
      start: start.toISOString(),
      end: end.toISOString(),
    }).catch(() => []),
    getPendingViewingRequests(supabase, user.id).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Viewings</h1>
        <p className="text-muted-foreground">
          Publish availability and respond to viewing requests for your rentals
        </p>
      </div>
      <ViewingRequestsPanel requests={requests} />
      <ViewingCalendar initialSlots={slots} />
    </div>
  );
}

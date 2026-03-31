import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentViewingSlots } from "@/services/agent/agent-viewing-service";
import { ViewingCalendar } from "@/components/dashboard/agent/viewings/ViewingCalendar";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Viewing Calendar - Agent Dashboard",
  description: "Manage and schedule property viewings",
};


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
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const start = new Date();
  start.setDate(1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  let slots = await getAgentViewingSlots(supabase, user.id, undefined, {
    start: start.toISOString(),
    end: end.toISOString(),
  }).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Viewing Calendar</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Schedule and manage property viewing slots
        </p>
      </div>
      <ViewingCalendar initialSlots={slots} />
    </div>
  );
}

export default function AgentViewingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeamMembers, getBranches } from "@/services/agent/agent-team-service";
import { TeamMemberList } from "@/components/dashboard/agent/team/TeamMemberList";
import type { AgentTeamMember, AgentBranch } from "@/types/agent";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Team Members | Agent | Britestate",
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

  let members: AgentTeamMember[] = [];
  let branches: AgentBranch[] = [];

  try {
    [members, branches] = await Promise.all([
      getTeamMembers(supabase, user.id),
      getBranches(supabase, user.id),
    ]);
  } catch {
    // Service call failed — render empty state
  }

  return <TeamMemberList members={members} branches={branches} />;
}

export default function AgentTeamPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

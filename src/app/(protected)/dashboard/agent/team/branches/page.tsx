import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBranches, getTeamMembers } from "@/services/agent/agent-team-service";
import { BranchManager } from "@/components/dashboard/agent/team/BranchManager";
import type { AgentBranch, AgentTeamMember } from "@/types/agent";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Branch Management | Agent | Britestate",
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

  let branches: AgentBranch[] = [];
  let members: AgentTeamMember[] = [];

  try {
    [branches, members] = await Promise.all([
      getBranches(supabase, user.id),
      getTeamMembers(supabase, user.id),
    ]);
  } catch {
    // Service call failed — render empty state
  }

  return <BranchManager branches={branches} members={members} />;
}

export default function BranchesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCrmClientById } from "@/services/agent/agent-crm-service";
import { ClientProfile } from "@/components/dashboard/agent/crm/ClientProfile";
import type { AgentCrmClient } from "@/types/agent";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Client Profile | Agent | Britestate",
};

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let client: AgentCrmClient | null = null;

  try {
    client = await getCrmClientById(supabase, id, user.id);
  } catch {
    notFound();
  }

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ClientProfile client={client} />
    </div>
  );
}

export default function AgentCrmClientPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}

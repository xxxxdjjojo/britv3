import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentSaleProgressions } from "@/services/agent/agent-sale-service";
import { SaleProgressionKanban } from "@/components/dashboard/agent/sales/SaleProgressionKanban";
import { getRiskScoresForAgent } from "@/services/agent/chain-risk-service";
import type { SaleStage, AgentSaleProgression, AgentSaleProgressionWithRisk, ChainRiskScore } from "@/types/agent";
import { SALE_STAGES } from "@/types/agent";
import { Skeleton } from "@/components/ui/skeleton";


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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let progressions: AgentSaleProgression[] = [];

  try {
    progressions = await getAgentSaleProgressions(supabase, user.id);
  } catch {
    // Render with empty state on error
  }

  let riskMap = new Map<string, ChainRiskScore>();
  try {
    riskMap = await getRiskScoresForAgent(supabase, user.id);
  } catch {
    // Chain risk tables may not exist yet — fail gracefully
  }

  // Group progressions by stage with risk data
  const grouped: Partial<Record<SaleStage, AgentSaleProgressionWithRisk[]>> = {};
  for (const stage of SALE_STAGES) {
    grouped[stage] = progressions
      .filter((p) => p.stage === stage)
      .map((p) => ({ ...p, chain_risk: riskMap.get(p.id) ?? null }));
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sale Progression
        </h1>
        <p className="text-sm text-muted-foreground">
          Track all active sales through each stage of the conveyancing process.
        </p>
      </div>

      <SaleProgressionKanban initialProgressions={grouped} />
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

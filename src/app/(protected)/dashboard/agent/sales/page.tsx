import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentSaleProgressions } from "@/services/agent/agent-sale-service";
import { SaleProgressionKanban } from "@/components/dashboard/agent/sales/SaleProgressionKanban";
import { getRiskScoresForAgent } from "@/services/agent/chain-risk-service";
import type { SaleStage, AgentSaleProgression, AgentSaleProgressionWithRisk, ChainRiskScore } from "@/types/agent";
import { SALE_STAGES } from "@/types/agent";

export default async function SalesPage() {
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
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Progression
        </p>
        <h1 className="font-heading mt-1 text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
          Sale Progression
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track all active sales through each stage of the conveyancing process.
        </p>
      </div>

      <SaleProgressionKanban initialProgressions={grouped} />
    </div>
  );
}

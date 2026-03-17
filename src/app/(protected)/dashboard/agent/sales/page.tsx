import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentSaleProgressions } from "@/services/agent/agent-sale-service";
import { SaleProgressionKanban } from "@/components/dashboard/agent/sales/SaleProgressionKanban";
import type { SaleStage, AgentSaleProgression } from "@/types/agent";
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

  // Group progressions by stage
  const grouped: Partial<Record<SaleStage, AgentSaleProgression[]>> = {};
  for (const stage of SALE_STAGES) {
    grouped[stage] = progressions.filter((p) => p.stage === stage);
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

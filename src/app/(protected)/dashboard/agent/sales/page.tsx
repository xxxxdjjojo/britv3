import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentSaleProgressions } from "@/services/agent/agent-sale-service";
import { SaleProgressionKanban } from "@/components/dashboard/agent/sales/SaleProgressionKanban";
import { SALE_STAGES } from "@/types/agent";
import type { AgentSaleProgression, SaleStage } from "@/types/agent";

export const metadata = {
  title: "Sale Progression | Agent Dashboard",
};

export default async function SalesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let progressions: AgentSaleProgression[] = [];
  try {
    progressions = await getAgentSaleProgressions(supabase, user.id);
  } catch (error) {
    console.error("Failed to fetch sale progressions:", error);
  }

  // Group by stage
  const grouped = SALE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = progressions.filter((p) => p.stage === stage);
      return acc;
    },
    {} as Record<SaleStage, AgentSaleProgression[]>,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sale Progression</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track all active sales through the UK conveyancing pipeline.
        </p>
      </div>

      <SaleProgressionKanban initialProgressions={grouped} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentSaleProgressions } from "@/services/agent/agent-sale-service";
import { SaleProgressionKanban } from "@/components/dashboard/agent/sales/SaleProgressionKanban";
import { SALE_STAGES } from "@/types/agent";
import type { AgentSaleProgression, SaleStage } from "@/types/agent";

export default async function SalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let progressions: AgentSaleProgression[] = [];
  try {
    progressions = await getAgentSaleProgressions(supabase, user.id);
  } catch {
    progressions = [];
  }

  // Group by stage
  const grouped = {} as Record<SaleStage, AgentSaleProgression[]>;
  for (const stage of SALE_STAGES) {
    grouped[stage] = [];
  }
  for (const prog of progressions) {
    if (grouped[prog.stage]) {
      grouped[prog.stage].push(prog);
    }
  }

  return <SaleProgressionKanban initialProgressions={grouped} />;
}

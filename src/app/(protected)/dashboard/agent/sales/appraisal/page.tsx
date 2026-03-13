import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketAppraisalTool } from "@/components/dashboard/agent/sales/MarketAppraisalTool";

export default async function MarketAppraisalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <MarketAppraisalTool />;
}

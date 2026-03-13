import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompetitorAnalysis } from "@/components/dashboard/agent/analytics/CompetitorAnalysis";

export default async function CompetitorAnalysisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <CompetitorAnalysis />;
}

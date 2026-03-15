import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketAppraisalTool } from "@/components/dashboard/agent/sales/MarketAppraisalTool";

export const metadata = {
  title: "Market Appraisal | Agent Dashboard",
};

export default async function AppraisalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Market Appraisal</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search by postcode to see comparable properties and generate a suggested
          asking price range.
        </p>
      </div>

      <MarketAppraisalTool />
    </div>
  );
}

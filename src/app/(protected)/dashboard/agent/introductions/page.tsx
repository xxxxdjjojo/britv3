import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentIntroductions,
  type AgentIntroductionRow,
} from "@/lib/truedeed/queries";
import { IntroductionsClient } from "@/components/dashboard/agent/introductions/IntroductionsClient";

export const metadata = {
  title: "Introductions | Agent | TrueDeed",
};

export default async function AgentIntroductionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let introductions: AgentIntroductionRow[] = [];

  try {
    introductions = await getAgentIntroductions(user.id);
  } catch {
    // Query failed — render an empty ledger
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Introductions</h1>
        <p className="text-muted-foreground">
          Your Truedeed introductions ledger — every recorded applicant first
          contact and its dispute window
        </p>
      </div>

      <IntroductionsClient introductions={introductions} />
    </div>
  );
}

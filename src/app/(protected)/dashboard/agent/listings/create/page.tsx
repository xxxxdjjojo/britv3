import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateListingWizard } from "@/components/dashboard/agent/listings/CreateListingWizard";

export const metadata = {
  title: "Create Listing | Agent | Britestate",
};

export default async function AgentCreateListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <CreateListingWizard />;
}

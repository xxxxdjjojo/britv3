import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateListingWizard } from "@/components/dashboard/agent/listings/CreateListingWizard";

export default async function CreateListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <CreateListingWizard />;
}

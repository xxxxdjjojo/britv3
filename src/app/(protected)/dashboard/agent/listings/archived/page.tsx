import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { ArchivedDraftListings } from "@/components/dashboard/agent/listings/ArchivedDraftListings";

export default async function ArchivedDraftPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let archivedListings;
  let draftListings;
  try {
    archivedListings = await getAgentListings(supabase, user.id, { status: "archived" });
  } catch {
    archivedListings = { data: [], count: 0 };
  }

  try {
    draftListings = await getAgentListings(supabase, user.id, { status: "draft" });
  } catch {
    draftListings = { data: [], count: 0 };
  }

  return (
    <ArchivedDraftListings
      archivedListings={archivedListings.data}
      draftListings={draftListings.data}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { ArchivedDraftListings } from "@/components/dashboard/agent/listings/ArchivedDraftListings";

export default async function ArchivedListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let archivedListings: Record<string, unknown>[] = [];
  let draftListings: Record<string, unknown>[] = [];

  try {
    const [archivedResult, draftResult] = await Promise.all([
      getAgentListings(supabase, user.id, "archived"),
      getAgentListings(supabase, user.id, "draft"),
    ]);
    archivedListings = archivedResult.listings as Record<string, unknown>[];
    draftListings = draftResult.listings as Record<string, unknown>[];
  } catch {
    archivedListings = [];
    draftListings = [];
  }

  const total = archivedListings.length + draftListings.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Archived &amp; Draft</h1>
        <p className="text-muted-foreground">
          {total} listing{total === 1 ? "" : "s"} not currently on the market
        </p>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <Link
          href="/dashboard/agent/listings"
          className="text-muted-foreground hover:text-foreground"
        >
          Active
        </Link>
        <Link
          href="/dashboard/agent/listings/sold"
          className="text-muted-foreground hover:text-foreground"
        >
          Sold / Let
        </Link>
        <Link
          href="/dashboard/agent/listings/archived"
          className="font-medium text-foreground border-b-2 border-primary pb-1"
        >
          Archived / Draft ({total})
        </Link>
      </div>

      <ArchivedDraftListings
        archivedListings={archivedListings}
        draftListings={draftListings}
      />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { SoldLetListings } from "@/components/dashboard/agent/listings/SoldLetListings";

export default async function SoldLetPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let soldListings: Record<string, unknown>[] = [];
  let letListings: Record<string, unknown>[] = [];

  try {
    const [soldResult, letResult] = await Promise.all([
      getAgentListings(supabase, user.id, "sold"),
      getAgentListings(supabase, user.id, "let"),
    ]);
    soldListings = soldResult.listings as Record<string, unknown>[];
    letListings = letResult.listings as Record<string, unknown>[];
  } catch {
    soldListings = [];
    letListings = [];
  }

  const allListings = [...soldListings, ...letListings];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sold &amp; Let</h1>
        <p className="text-muted-foreground">
          {allListings.length} completed transaction{allListings.length === 1 ? "" : "s"}
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
          className="font-medium text-foreground border-b-2 border-primary pb-1"
        >
          Sold / Let ({allListings.length})
        </Link>
        <Link
          href="/dashboard/agent/listings/archived"
          className="text-muted-foreground hover:text-foreground"
        >
          Archived / Draft
        </Link>
      </div>

      <SoldLetListings listings={allListings} />
    </div>
  );
}

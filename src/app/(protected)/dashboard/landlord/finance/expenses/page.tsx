import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExpenseTrackerClient } from "./ExpenseTrackerClient";
import type { FinancialEntry } from "@/types/landlord";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 9.18 Expense Tracker — Server Component
 *
 * Fetches all financial_entries across the landlord's portfolio and passes
 * them to the client wrapper for filtering, add/edit/delete.
 */

function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all entries for this landlord across all properties
  const { data: entries, error } = await supabase
    .from("financial_entries")
    .select("*, properties(address_line_1, city, postcode)")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  if (error) {
    console.error("Failed to load financial entries:", error.message);
  }

  // Fetch landlord properties for filter dropdown
  const { data: properties } = await supabase
    .from("properties")
    .select("id, address_line_1, city, postcode")
    .eq("landlord_id", user.id)
    .order("address_line_1");

  return (
    <ExpenseTrackerClient
      initialEntries={(entries ?? []) as FinancialEntry[]}
      properties={properties ?? []}
    />
  );
}

export default function ExpenseTrackerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

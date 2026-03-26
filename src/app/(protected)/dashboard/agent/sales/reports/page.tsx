import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendorReportList } from "@/components/dashboard/agent/sales/VendorReportPDF";
import type { AgentVendorReport } from "@/types/agent";
import { Skeleton } from "@/components/ui/skeleton";

type Listing = {
  id: string;
  title: string | null;
  address_line_1: string | null;
};


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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch active listings for property selector
  const { data: listingsData } = await supabase
    .from("listings")
    .select("id, title, address_line_1")
    .eq("user_id", user.id)
    .eq("status", "active");

  const listings: Listing[] = (listingsData ?? []) as Listing[];

  // Fetch existing reports (newest first)
  const { data: reportsData } = await supabase
    .from("agent_vendor_reports")
    .select("*")
    .eq("agent_id", user.id)
    .order("generated_at", { ascending: false });

  const reports: AgentVendorReport[] = (reportsData ?? []) as AgentVendorReport[];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Vendor Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate and download performance reports to share with vendors.
        </p>
      </div>

      <VendorReportList
        listings={listings}
        reports={reports}
        userId={user.id}
      />
    </div>
  );
}

export default function VendorReportsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

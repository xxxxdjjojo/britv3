import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendorReportsPage } from "@/components/dashboard/agent/sales/VendorReportsPage";
import type { AgentVendorReport } from "@/types/agent";

export const metadata = {
  title: "Vendor Reports | Agent Dashboard",
};

type Listing = {
  id: string;
  address_line_1: string;
  city: string | null;
};

export default async function ReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch active listings for this agent
  const { data: listingsData } = await supabase
    .from("listings")
    .select("id, address_line_1, city")
    .eq("agent_id", user.id)
    .eq("status", "active");

  const listings: Listing[] = (listingsData ?? []) as Listing[];

  // Fetch existing vendor reports
  const { data: reportsData } = await supabase
    .from("agent_vendor_reports")
    .select("*")
    .eq("agent_id", user.id)
    .order("generated_at", { ascending: false });

  const reports: AgentVendorReport[] = (reportsData ?? []) as AgentVendorReport[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendor Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate and download performance reports to share with your vendors.
        </p>
      </div>

      <VendorReportsPage listings={listings} initialReports={reports} />
    </div>
  );
}

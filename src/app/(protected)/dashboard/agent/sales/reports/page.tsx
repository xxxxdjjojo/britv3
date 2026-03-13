import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendorReportPDF } from "@/components/dashboard/agent/sales/VendorReportPDF";
import type { AgentVendorReport } from "@/types/agent";

export default async function VendorReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let reports: AgentVendorReport[] = [];
  try {
    const { data, error } = await supabase
      .from("agent_vendor_reports")
      .select("*")
      .eq("agent_id", user.id)
      .order("generated_at", { ascending: false });

    if (!error && data) {
      reports = data as AgentVendorReport[];
    }
  } catch {
    reports = [];
  }

  return <VendorReportPDF initialReports={reports} />;
}

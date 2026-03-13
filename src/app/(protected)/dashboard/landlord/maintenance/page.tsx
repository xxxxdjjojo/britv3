import { createClient } from "@/lib/supabase/server";
import { getPortfolioMaintenanceRequests } from "@/services/landlord/maintenance-service";
import { MaintenanceInboxClient } from "./MaintenanceInboxClient";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const supabase = await createClient();
  const requests = await getPortfolioMaintenanceRequests(supabase);

  return <MaintenanceInboxClient initialData={requests} />;
}

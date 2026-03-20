import { createClient } from "@/lib/supabase/server";
import { listApplications } from "@/services/landlord/tenant-application-service";
import { TenantScreeningClient } from "@/components/landlord/TenantScreeningClient";

export default async function TenantsPage() {
  const supabase = await createClient();

  let applications = await listApplications(supabase).catch((err: unknown) => {
    console.error("[landlord/tenants] listApplications failed:", err instanceof Error ? err.message : err, err);
    return [];
  });

  return <TenantScreeningClient initialApplications={applications} />;
}

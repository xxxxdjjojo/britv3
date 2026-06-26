import { createClient } from "@/lib/supabase/server";
import { listApplications } from "@/services/landlord/tenant-application-service";
import { getPortfolioProperties } from "@/services/landlord/portfolio-service";
import { TenantScreeningClient } from "@/components/landlord/TenantScreeningClient";

export default async function TenantsPage() {
  const supabase = await createClient();

  const [applications, portfolio] = await Promise.all([
    listApplications(supabase).catch(() => []),
    getPortfolioProperties(supabase).catch(() => []),
  ]);

  const properties = portfolio.map((p) => ({
    id: p.id,
    address_line_1: p.address_line_1,
    city: p.city,
  }));

  return (
    <TenantScreeningClient initialApplications={applications} properties={properties} />
  );
}

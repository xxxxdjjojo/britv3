import { createClient } from "@/lib/supabase/server";
import { getPortfolio } from "@/services/landlord/portfolio-service";
import { PortfolioGrid } from "@/components/landlord/PortfolioGrid";

export const metadata = {
  title: "Portfolio | Britestate",
};

export default async function PortfolioPage() {
  const supabase = await createClient();
  const properties = await getPortfolio(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
      </div>

      <PortfolioGrid properties={properties} />
    </div>
  );
}

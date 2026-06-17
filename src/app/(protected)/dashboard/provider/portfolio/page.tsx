import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortfolioGrid } from "@/components/dashboard/provider/PortfolioGrid";
import { getPortfolioItems } from "@/services/provider/provider-portfolio-service";
import type { ProviderPortfolioItem } from "@/types/provider-dashboard";

export const metadata = {
  title: "Portfolio | Provider Dashboard",
};

export default async function ProviderPortfolioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Resolve provider profile id
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  let items: ProviderPortfolioItem[] = [];
  try {
    items = await getPortfolioItems(supabase, providerId);
  } catch {
    // Render empty state if table doesn't exist yet
    items = [];
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <PortfolioGrid initialItems={items} providerId={providerId} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServicesManager } from "@/components/dashboard/provider/ServicesManager";
import type { ProviderService } from "@/types/provider-dashboard";

export const metadata = {
  title: "My Services | Provider Dashboard",
};

export default async function ProviderServicesPage() {
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

  // Fetch services
  const { data: services } = await supabase
    .from("provider_services")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: true });

  const safeServices: ProviderService[] = (services ?? []) as ProviderService[];

  return (
    <div className="p-6 max-w-5xl">
      <ServicesManager initialServices={safeServices} providerId={providerId} />
    </div>
  );
}

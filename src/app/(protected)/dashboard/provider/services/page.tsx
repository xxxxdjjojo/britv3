import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServicesManager } from "@/components/dashboard/provider/ServicesManager";
import type { ProviderService } from "@/types/provider-dashboard";

export const metadata = {
  title: "My Services | Provider Dashboard",
};

export default async function ProviderServicesPage() {
  try {
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
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.user_id ?? user.id;

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
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="p-6 max-w-5xl">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">My Services</h1>
        <p className="mt-4 text-sm text-neutral-500">Unable to load services. Please try refreshing the page.</p>
      </div>
    );
  }
}

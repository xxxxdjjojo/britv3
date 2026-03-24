import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProviderSidebar } from "@/components/dashboard/provider/ProviderSidebar";
import { ProviderContextWrapper } from "@/components/dashboard/provider/ProviderContextWrapper";
import { ProviderMainWrapper } from "@/components/dashboard/provider/ProviderMainWrapper";
import { resolveProviderId } from "@/lib/provider/resolve-provider";

export default async function ProviderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (profile?.active_role !== "service_provider") {
    redirect(`/dashboard/${profile?.active_role ?? "homebuyer"}`);
  }

  let providerIdentity: Awaited<ReturnType<typeof resolveProviderId>>;
  try {
    providerIdentity = await resolveProviderId(supabase);
  } catch {
    redirect("/onboarding/provider");
  }

  const { data: stripeAccount } = await supabase
    .from("stripe_connect_accounts")
    .select("stripe_account_id, charges_enabled")
    .eq("provider_id", providerIdentity!.userId)
    .maybeSingle();

  const initialData = {
    providerId: providerIdentity!.providerId,
    userId: providerIdentity!.userId,
    businessName: providerIdentity!.businessName,
    stripeAccountId: (stripeAccount?.stripe_account_id as string | null) ?? null,
    chargesEnabled: (stripeAccount?.charges_enabled as boolean | null) ?? false,
  };

  return (
    <div className="flex min-h-screen">
      <ProviderSidebar />
      <ProviderMainWrapper>
        <ProviderContextWrapper initialData={initialData}>
          {children}
        </ProviderContextWrapper>
      </ProviderMainWrapper>
    </div>
  );
}

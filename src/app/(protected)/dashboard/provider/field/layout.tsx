import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProviderContextWrapper } from "@/components/dashboard/provider/ProviderContextWrapper";
import { FieldBottomNav } from "@/components/dashboard/provider/FieldBottomNav";

export default async function FieldLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (profile?.active_role !== "service_provider") {
    redirect(`/dashboard/${(profile?.active_role as string | null) ?? "homebuyer"}`);
  }

  // Resolve provider identity
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: stripeAccount } = await supabase
    .from("stripe_connect_accounts")
    .select("stripe_account_id, charges_enabled")
    .eq("provider_id", user.id)
    .maybeSingle();

  const initialData = {
    providerId: (providerProfile?.id as string | null) ?? user.id,
    userId: user.id,
    businessName: (providerProfile?.business_name as string | null) ?? "",
    stripeAccountId: (stripeAccount?.stripe_account_id as string | null) ?? null,
    chargesEnabled: (stripeAccount?.charges_enabled as boolean | null) ?? false,
  };

  return (
    <div className="min-h-screen bg-surface pb-20">
      <ProviderContextWrapper initialData={initialData}>
        <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
      </ProviderContextWrapper>
      <FieldBottomNav />
    </div>
  );
}

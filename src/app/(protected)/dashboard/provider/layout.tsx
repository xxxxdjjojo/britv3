import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProviderContextWrapper } from "@/components/dashboard/provider/ProviderContextWrapper";
import { resolveProviderId } from "@/lib/provider/resolve-provider";
import { dashboardPathForRole } from "@/lib/routes";
import type { UserRole } from "@/types/auth";
import { evaluateProviderAccess } from "@/services/provider/provider-access-policy";
import { getProviderAccessState } from "@/services/provider/provider-access-state";

export default async function ProviderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let accessState: Awaited<ReturnType<typeof getProviderAccessState>>;
  try {
    accessState = await getProviderAccessState(supabase, user.id, {
      emailConfirmed: !!user.email_confirmed_at,
    });
  } catch {
    return (
      <section
        role="alert"
        className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950"
      >
        <h1 className="text-lg font-semibold">
          We can’t verify your provider access right now
        </h1>
        <p className="mt-2 text-sm">
          Your provider tools remain locked. Refresh the page in a moment or
          contact support if the problem continues.
        </p>
      </section>
    );
  }
  const layoutDecision = evaluateProviderAccess(accessState, "progress");

  if (!layoutDecision.allowed) {
    const activeRole = accessState.role as UserRole | null | undefined;
    redirect(
      activeRole ? dashboardPathForRole(activeRole) : "/dashboard/homebuyer",
    );
  }

  let providerIdentity: Awaited<ReturnType<typeof resolveProviderId>>;
  try {
    providerIdentity = await resolveProviderId(supabase);
  } catch {
    redirect("/register/onboarding/provider");
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

  // Parent dashboard/layout.tsx provides the shared Sidebar + main; keep the
  // provider data context so provider pages still receive initialData.
  return (
    <ProviderContextWrapper initialData={initialData}>
      {children}
    </ProviderContextWrapper>
  );
}

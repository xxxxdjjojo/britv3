import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProviderProfile } from "@/services/provider/provider-profile-service";
import { ProfileEditForm } from "@/components/dashboard/provider/ProfileEditForm";

export default async function ProviderProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProviderProfile(supabase, user.id).catch(() => null);

  if (!profile) {
    // Provider hasn't completed onboarding yet — send them to the onboarding
    // flow (the same destination the provider layout uses when no provider
    // identity resolves). There is no standalone /profile/setup route.
    redirect("/register/onboarding/provider");
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
          Provider Portal
        </p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark">
          Edit Profile
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Keep your profile up to date to attract more clients.
        </p>
      </div>

      {/* Form + Live Preview */}
      <ProfileEditForm profile={profile} userId={user.id} />
    </div>
  );
}

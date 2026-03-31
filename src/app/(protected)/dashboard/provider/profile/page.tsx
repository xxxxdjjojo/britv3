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
    // Provider hasn't set up their profile yet — redirect to setup
    redirect("/dashboard/provider/profile/setup");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-neutral-900">
            Profile Settings
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Keep your profile up to date to attract more clients.
          </p>
        </div>
      </div>

      {/* Form + Live Preview */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <ProfileEditForm profile={profile} userId={user.id} />
      </div>
    </div>
  );
}

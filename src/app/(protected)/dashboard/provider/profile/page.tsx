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
    <div className="p-6 max-w-5xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Edit Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Keep your profile up to date to attract more clients.
        </p>
      </div>

      {/* Form + Live Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <ProfileEditForm profile={profile} userId={user.id} />
      </div>
    </div>
  );
}

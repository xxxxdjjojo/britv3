import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvatarUploader } from "@/components/settings/AvatarUploader";
import { ProfileForm } from "@/components/settings/ProfileForm";

export const metadata: Metadata = {
  title: "Account | Britestate",
};

export default async function AccountSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, postcode, bio, avatar_url")
    .eq("id", user.id)
    .single();

  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";
  const email = user.email ?? "";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="font-heading text-xl font-semibold text-neutral-900 dark:text-white">
          Profile
        </h2>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Manage your public profile and personal details
        </p>
      </div>

      {/* Avatar section */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Profile Photo
        </h3>
        <AvatarUploader
          userId={user.id}
          avatarUrl={profile?.avatar_url ?? null}
          firstName={firstName}
          lastName={lastName}
        />
      </section>

      {/* Identity & contact section */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Identity &amp; Contact
        </h3>
        <ProfileForm
          initialData={{
            first_name: firstName,
            last_name: lastName,
            phone: profile?.phone ?? null,
            postcode: profile?.postcode ?? null,
            bio: profile?.bio ?? null,
            email,
          }}
        />
      </section>
    </div>
  );
}

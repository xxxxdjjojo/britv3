import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AvatarUploader } from "@/components/settings/AvatarUploader";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { DangerZone } from "@/components/settings/DangerZone";

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

      {/* Danger zone */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-error">
          Danger Zone
        </h3>
        <div className="rounded-lg border border-error/20 bg-error/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-error" />
            <div className="space-y-2">
              <p className="font-body text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Deactivate your account
              </p>
              <ul className="list-inside list-disc space-y-1 font-body text-xs text-neutral-600 dark:text-neutral-400">
                <li>Your account will be scheduled for deletion in 30 days</li>
                <li>
                  You can cancel by logging back in within the grace period
                </li>
                <li>After 30 days, all your data will be permanently removed</li>
              </ul>
              <DangerZone />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


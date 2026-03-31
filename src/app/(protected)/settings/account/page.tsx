import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvatarUploader } from "@/components/settings/AvatarUploader";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Account | Britestate",
};


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, postcode, bio, avatar_url, active_role")
    .eq("id", user.id)
    .single();

  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";
  const email = user.email ?? "";
  const activeRole = (profile?.active_role as string) ?? "";

  // Fetch role-specific data
  let roleData: Record<string, unknown> | undefined;

  if (activeRole === "agent") {
    const { data } = await supabase
      .from("agent_agency_profiles")
      .select("agency_name, specializations, coverage_areas, description, contact_email, contact_phone")
      .eq("agent_id", user.id)
      .single();
    if (data) roleData = data as Record<string, unknown>;
  } else if (activeRole === "service_provider") {
    const { data } = await supabase
      .from("service_provider_details")
      .select("business_name, trading_name, years_in_business, qualifications, service_postcodes")
      .eq("user_id", user.id)
      .single();
    if (data) roleData = data as Record<string, unknown>;
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Profile
        </h2>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Manage your public profile and personal details
        </p>
      </div>

      {/* Avatar section */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
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
        <h3 className="font-heading text-base font-semibold text-foreground">
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
          activeRole={activeRole}
          roleData={roleData}
        />
      </section>

    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

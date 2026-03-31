import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProviderBadges } from "@/services/provider/provider-verification-service";
import { BadgeGallery } from "@/components/dashboard/provider/BadgeGallery";

export const metadata = {
  title: "Badges | Provider Dashboard",
};

export default async function BadgesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  const badges = await getProviderBadges(supabase, providerId).catch(() => []);

  const activeBadgeCount = badges.filter((b) => {
    if (!b.expires_at) return true;
    return new Date(b.expires_at).getTime() > Date.now();
  }).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-neutral-900">
            Badge Management
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Badges are awarded when verification steps are approved. They appear
            on your public profile to build trust with customers.
          </p>
        </div>

        {activeBadgeCount > 0 && (
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary-lighter text-brand-primary">
              <Award className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Active</p>
              <p className="text-2xl font-black text-neutral-900 tabular-nums">
                {activeBadgeCount}
              </p>
            </div>
          </div>
        )}
      </div>

      <BadgeGallery badges={badges} />
    </div>
  );
}

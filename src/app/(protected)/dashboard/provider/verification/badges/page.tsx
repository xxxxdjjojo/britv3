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
    <div className="space-y-8 p-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Badges &amp; Certifications</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Badges are awarded when verification steps are approved. They appear on your public
            profile to build trust with customers.
          </p>
        </div>

        {activeBadgeCount > 0 && (
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#E8F5EE] text-[#1B4D3E]">
              <Award className="size-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Active</p>
              <p className="text-xl font-black text-neutral-900">{activeBadgeCount}</p>
            </div>
          </div>
        )}
      </div>

      <BadgeGallery badges={badges} />
    </div>
  );
}

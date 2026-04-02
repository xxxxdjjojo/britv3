import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProviderProfile } from "@/services/provider/provider-profile-service";
import { ProfileEditForm } from "@/components/dashboard/provider/ProfileEditForm";

export default async function ProviderProfilePage() {
  try {
    const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProviderProfile(supabase, user.id).catch(() => null);

  if (!profile) {
    redirect("/dashboard/provider/profile/setup");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">
          Public Profile Management
        </h1>
        <p className="text-on-surface-variant max-w-2xl">
          Craft your digital presence. High-quality credentials and a detailed portfolio
          increase your chance of selection by 40%.
        </p>
      </div>

      {/* Two-column bento layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold font-headline text-primary mb-1">
                  Business Identity
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Update your core brand details and visual identity.
                </p>
              </div>
              <span className="px-3 py-1 bg-secondary-fixed-dim text-on-secondary-fixed text-[10px] font-bold tracking-widest uppercase rounded-full">
                Primary
              </span>
            </div>
            <ProfileEditForm profile={profile} userId={user.id} />
          </div>
        </div>

        {/* Right: trust score + service area */}
        <div className="lg:col-span-4 space-y-8">
          {/* Trust score card */}
          <section className="bg-primary-container text-white rounded-xl p-8 shadow-[0_20px_50px_rgba(0,54,41,0.1)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-headline">Trust Score</h3>
              <div className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full text-xs font-bold">
                EXCELLENT
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-secondary-fixed text-lg">✓</span>
                <span className="text-sm text-surface/90">Identity Verified</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-secondary-fixed text-lg">✓</span>
                <span className="text-sm text-surface/90">Insurance Verified</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-secondary-fixed text-lg">✓</span>
                <span className="text-sm text-surface/90">Credentials Uploaded</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-surface/70 leading-relaxed italic">
                &ldquo;Your verification status is visible to all premium estate managers.&rdquo;
              </p>
            </div>
          </section>

          {/* Availability card */}
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold font-headline text-primary mb-6">
              Availability
            </h3>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-bold text-outline uppercase">{day}</span>
                  <div
                    className={[
                      "w-full aspect-square rounded-sm",
                      i < 5 ? "bg-primary-fixed" : "bg-surface-container-low",
                    ].join(" ")}
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-on-surface-variant text-center">
              Standard Hours: 08:00 – 18:00
            </p>
          </section>
        </div>
      </div>
    </div>
    );
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-headline text-4xl font-extrabold text-primary">Public Profile Management</h1>
        <p className="mt-4 text-on-surface-variant">Unable to load profile data. Please try refreshing the page.</p>
      </div>
    );
  }
}

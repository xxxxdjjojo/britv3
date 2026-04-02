import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProviderBadges } from "@/services/provider/provider-verification-service";
import { getProviderProfile } from "@/services/provider/provider-profile-service";

export const metadata = {
  title: "Verification Badges | Provider Dashboard",
};

type MilestoneBadge = Readonly<{
  icon: string;
  title: string;
  subtitle: string;
  requirement: string;
}>;

const MILESTONE_BADGES: MilestoneBadge[] = [
  {
    icon: "military_tech",
    title: "Elite Partner",
    subtitle: "Exclusive Network",
    requirement:
      "Maintain a 4.9+ rating and complete over 100 successful portfolio transactions.",
  },
  {
    icon: "counter_5",
    title: "Milestone",
    subtitle: "50+ Projects Complete",
    requirement: "Complete 50 unique listings or management contracts via the platform.",
  },
  {
    icon: "award_star",
    title: "Top Rated",
    subtitle: "Customer Excellence",
    requirement: "Maintain a top 5% status in client satisfaction for 6 consecutive months.",
  },
];

type EarnedBadgeDisplay = Readonly<{
  icon: string;
  title: string;
  subtitle: string;
  requirement: string;
}>;

function getEarnedBadgeDisplay(badgeType: string): EarnedBadgeDisplay {
  const map: Record<string, EarnedBadgeDisplay> = {
    identity_verified: {
      icon: "verified",
      title: "Identity",
      subtitle: "Gov-ID Verified",
      requirement:
        "Successful submission of passport or driving license and biometric check.",
    },
    insurance_verified: {
      icon: "shield",
      title: "Insured",
      subtitle: "Public Liability Active",
      requirement:
        "Valid £2M+ Public Liability Insurance certificate uploaded and verified annually.",
    },
    gas_safe: {
      icon: "workspace_premium",
      title: "Qualified",
      subtitle: "Gas Safe Registered",
      requirement: "Current Gas Safe Registration maintained and verified by the register.",
    },
    electrical_certified: {
      icon: "workspace_premium",
      title: "Qualified",
      subtitle: "Industry Certified",
      requirement: "Accreditation from recognized industry boards (e.g. ARLA, NAEA).",
    },
    cscs_holder: {
      icon: "workspace_premium",
      title: "Qualified",
      subtitle: "CSCS Card Holder",
      requirement: "Valid CSCS card demonstrating construction industry competency.",
    },
    top_rated: {
      icon: "award_star",
      title: "Top Rated",
      subtitle: "Customer Excellence",
      requirement:
        "Maintained a top 5% status in client satisfaction for 6 consecutive months.",
    },
    references_complete: {
      icon: "groups",
      title: "Trusted",
      subtitle: "References Verified",
      requirement: "6 verified client references and 3 peer endorsements collected.",
    },
  };
  return (
    map[badgeType] ?? {
      icon: "verified",
      title: "Verified",
      subtitle: "Credential Confirmed",
      requirement: "Credential has been verified by the Britestate team.",
    }
  );
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

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
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.user_id ?? user.id;

  const [badges, profile] = await Promise.all([
    getProviderBadges(supabase, providerId).catch(() => []),
    getProviderProfile(supabase, user.id).catch(() => null),
  ]);

  const activeBadges = badges.filter((b) => !isExpired(b.expires_at));
  const activeBadgeCount = activeBadges.length;

  // Verification history (all badges)
  const historyRows = badges.map((b) => ({
    id: b.id,
    name: b.badge_label,
    verifiedOn: new Date(b.earned_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    expires: b.expires_at
      ? new Date(b.expires_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Never",
    expired: isExpired(b.expires_at),
    badgeType: b.badge_type,
  }));

  const businessName = profile?.business_name ?? "Your Business";

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Hero Header */}
      <section className="mb-16">
        <div className="flex flex-col gap-2">
          <span className="font-label text-[0.6875rem] font-semibold tracking-[0.05em] text-secondary uppercase">
            Credentials &amp; Trust
          </span>
          <h1 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-4">
            Verification Badges
          </h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            Your badges represent the quality and reliability of your service. Verified providers
            receive 40% more inquiries on average. Maintain your standing by keeping your
            credentials updated.
          </p>
        </div>
      </section>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-12 items-start">
        {/* Badge Gallery */}
        <div className="col-span-12 lg:col-span-8 space-y-20">
          {/* Earned Badges */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                Earned Credentials
              </h2>
              <span className="font-label text-[0.6875rem] font-bold text-primary bg-primary-fixed px-3 py-1 rounded-full uppercase tracking-wider">
                {activeBadgeCount} Active
              </span>
            </div>

            {activeBadges.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-outline-variant/40 p-12 text-center">
                <p className="text-on-surface-variant text-sm">
                  No active badges yet. Complete your verification steps to earn credentials.
                </p>
                <Link
                  href="/dashboard/provider/verification"
                  className="mt-4 inline-block text-xs font-bold text-primary uppercase tracking-widest hover:underline"
                >
                  Go to Verification Hub
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeBadges.map((badge) => {
                  const display = getEarnedBadgeDisplay(badge.badge_type);
                  return (
                    <div
                      key={badge.id}
                      className="group relative bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-[0_20px_50px_rgba(26,28,28,0.05)] transition-all duration-300 cursor-help"
                    >
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="none"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-headline font-bold text-lg mb-1">{display.title}</h3>
                      <p className="text-xs text-on-surface-variant">{display.subtitle}</p>

                      {/* Hover tooltip */}
                      <div className="absolute inset-0 bg-primary/95 text-white p-6 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center">
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2 opacity-70">
                          Requirement
                        </p>
                        <p className="text-sm font-medium leading-tight">{display.requirement}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Milestones */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                Available Milestones
              </h2>
              <span className="font-label text-[0.6875rem] font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full uppercase tracking-wider">
                {MILESTONE_BADGES.length} Locked
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MILESTONE_BADGES.map((milestone) => (
                <div
                  key={milestone.title}
                  className="group relative bg-surface-container-low p-8 rounded-xl transition-all duration-300 cursor-help"
                >
                  <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant mb-6 group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                  </div>
                  <h3 className="font-headline font-bold text-lg mb-1 text-on-surface-variant group-hover:text-on-surface transition-colors">
                    {milestone.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant">{milestone.subtitle}</p>

                  {/* Hover tooltip */}
                  <div className="absolute inset-0 bg-secondary/95 text-white p-6 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2 opacity-70">
                      Requirement
                    </p>
                    <p className="text-sm font-medium leading-tight">{milestone.requirement}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Sidebar */}
        <aside className="col-span-12 lg:col-span-4 sticky top-28 space-y-8">
          {/* Profile Preview */}
          <div className="bg-surface-container-high rounded-xl p-1 overflow-hidden">
            <div className="bg-surface-container-lowest rounded-lg p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-headline font-bold text-sm uppercase tracking-widest">
                  Public Profile Preview
                </h3>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-on-surface-variant"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container-high shadow-lg bg-surface-container flex items-center justify-center">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt={businessName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-on-surface-variant">
                        {businessName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-secondary text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <h4 className="font-headline text-2xl font-bold text-on-surface">
                  {businessName}
                </h4>
                <p className="text-on-surface-variant text-sm mb-6">
                  {profile?.services?.[0] ?? "Service Provider"}
                </p>

                {/* Badge icons */}
                <div className="flex gap-3 justify-center mb-8">
                  {activeBadges.slice(0, 3).map((badge) => (
                    <div
                      key={badge.id}
                      className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-primary"
                      title={badge.badge_label}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ))}
                  {activeBadges.length === 0 && (
                    <p className="text-xs text-on-surface-variant italic">No badges yet</p>
                  )}
                </div>

                <div className="w-full grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-lg text-left">
                    <p className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant mb-1">
                      Trust Score
                    </p>
                    <p className="font-headline font-bold text-lg text-primary">
                      {activeBadgeCount > 0 ? `${Math.min(activeBadgeCount * 15 + 50, 99)}%` : "0%"}
                    </p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-lg text-left">
                    <p className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant mb-1">
                      Badges
                    </p>
                    <p className="font-headline font-bold text-lg text-primary">
                      {activeBadgeCount}/5
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Elite status CTA */}
          <div className="p-8 bg-primary rounded-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/5 rounded-full group-hover:scale-125 transition-transform duration-300" />
            <h4 className="font-headline font-bold text-xl mb-3 relative z-10">
              Elite Status Awaits
            </h4>
            <p className="text-white/80 text-sm leading-relaxed mb-6 relative z-10">
              You are only a few credentials away from unlocking the{" "}
              <strong className="text-white">Elite Partner</strong> badge.
            </p>
            <Link
              href="/dashboard/provider/verification/credentials"
              className="block w-full py-4 bg-secondary-container text-on-secondary-container font-headline font-bold rounded-lg text-sm text-center transition-transform active:scale-95 relative z-10"
            >
              Boost Your Credentials
            </Link>
          </div>
        </aside>
      </div>

      {/* Verification History Table */}
      <section className="mt-32 pt-20 border-t border-outline-variant/20">
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-8">
          Verification History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-on-surface-variant font-label text-[0.6875rem] uppercase tracking-widest">
                <th className="pb-6 pr-4">Credential Name</th>
                <th className="pb-6 pr-4">Verified On</th>
                <th className="pb-6 pr-4">Expires</th>
                <th className="pb-6 pr-4">Status</th>
                <th className="pb-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {historyRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant text-sm">
                    No verification history yet. Complete your first verification step.
                  </td>
                </tr>
              ) : (
                historyRows.map((row) => (
                  <tr
                    key={row.id}
                    className={[
                      "hover:bg-surface-container-low transition-colors",
                      row.expired ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    <td className="py-6 border-b border-outline-variant/10 pr-4">{row.name}</td>
                    <td className="py-6 border-b border-outline-variant/10 pr-4 text-on-surface-variant">
                      {row.verifiedOn}
                    </td>
                    <td className="py-6 border-b border-outline-variant/10 pr-4 text-on-surface-variant">
                      {row.expires}
                    </td>
                    <td className="py-6 border-b border-outline-variant/10 pr-4">
                      {row.expired ? (
                        <span className="inline-flex items-center gap-1.5 text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-6 border-b border-outline-variant/10 text-right">
                      <Link
                        href="/dashboard/provider/verification/credentials"
                        className={[
                          "text-xs font-bold hover:underline transition-colors",
                          row.expired ? "text-on-surface-variant" : "text-primary",
                        ].join(" ")}
                      >
                        {row.expired ? "Re-upload" : "View Certificate"}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

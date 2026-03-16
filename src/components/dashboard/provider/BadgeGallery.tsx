import {
  ShieldCheck,
  Award,
  Flame,
  Zap,
  HardHat,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ProviderBadge } from "@/types/provider-dashboard";

type Props = Readonly<{
  badges: ProviderBadge[];
}>;

const BADGE_ICONS: Record<string, LucideIcon> = {
  identity_verified: ShieldCheck,
  insurance_verified: Award,
  gas_safe: Flame,
  electrical_certified: Zap,
  cscs_holder: HardHat,
  top_rated: Star,
  references_complete: Users,
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  return expiry > now && expiry - now <= THIRTY_DAYS_MS;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

function BadgeCard({ badge }: { badge: ProviderBadge }) {
  const Icon = BADGE_ICONS[badge.badge_type] ?? Award;
  const expired = isExpired(badge.expires_at);
  const expiringSoon = !expired && isExpiringSoon(badge.expires_at);

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm ${
        expired ? "grayscale opacity-60" : ""
      }`}
    >
      {/* Expired overlay label */}
      {expired && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
          <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500">
            Expired
          </span>
        </div>
      )}

      {/* Expiry warning banner */}
      {expiringSoon && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700">
          Expires soon — renew before{" "}
          {new Date(badge.expires_at!).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      )}

      {/* Icon + label */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F5EE] text-[#1B4D3E]">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{badge.badge_label}</p>
          {badge.description && (
            <p className="text-xs text-neutral-500 mt-0.5">{badge.description}</p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-0.5 text-xs text-neutral-400">
        <p>
          Earned{" "}
          {new Date(badge.earned_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        {badge.expires_at && (
          <p className={expired ? "text-red-400" : expiringSoon ? "text-amber-600" : ""}>
            Expires{" "}
            {new Date(badge.expires_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

export function BadgeGallery({ badges }: Props) {
  const activeBadges = badges.filter((b) => !isExpired(b.expires_at));
  const expiredBadges = badges.filter((b) => isExpired(b.expires_at));

  if (badges.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
        <Award className="mx-auto mb-3 size-8 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-500">No badges earned yet</p>
        <p className="mt-1 text-xs text-neutral-400">
          Complete your verification steps to start earning trust badges.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {activeBadges.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-neutral-900">
            Active Badges
            <span className="ml-2 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#16A34A]">
              {activeBadges.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </section>
      )}

      {expiredBadges.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-neutral-500">
            Expired Badges
            <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-400">
              {expiredBadges.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {expiredBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

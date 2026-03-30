import Image from "next/image";
import Link from "next/link";
import { Star, Wrench, User, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = Readonly<{
  postcode: string;
}>;

type TradespersonRow = {
  user_id: string;
  business_name: string;
  slug: string;
  services: string[];
  provider_rating_stats: {
    average_rating: number | null;
    total_reviews: number | null;
  } | null;
  profiles: {
    avatar_url: string | null;
    full_name: string | null;
  } | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postcodeDistrict(postcode: string): string {
  return postcode.trim().split(" ")[0] ?? postcode.trim();
}

function formatRating(rating: number | null | undefined): string {
  if (rating == null) return "New";
  return rating.toFixed(1);
}

function primaryService(services: string[]): string {
  if (services.length === 0) return "Tradesperson";
  const label = services[0]?.replace(/_/g, " ") ?? "Tradesperson";
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchTradespeople(postcode: string): Promise<TradespersonRow[]> {
  const supabase = await createClient();

  const district = postcodeDistrict(postcode);

  const { data, error } = await supabase
    .from("service_provider_details")
    .select(
      `user_id,
       business_name,
       slug,
       services,
       profiles!inner (
         avatar_url,
         full_name,
         provider_verification_status,
         deleted_at
       ),
       provider_rating_stats (
         average_rating,
         total_reviews
       )`,
    )
    .filter("profiles.provider_verification_status", "eq", "verified")
    .filter("profiles.deleted_at", "is", null)
    .contains("service_postcodes", [district])
    .limit(3);

  if (error || !data || data.length === 0) return [];

  return data as unknown as TradespersonRow[];
}

// ---------------------------------------------------------------------------
// Card sub-component
// ---------------------------------------------------------------------------

function TradespersonCard({ tp }: Readonly<{ tp: TradespersonRow }>) {
  const name = tp.profiles?.full_name ?? tp.business_name;
  const avatarUrl = tp.profiles?.avatar_url ?? null;
  const rating = tp.provider_rating_stats?.average_rating ?? null;
  const reviewCount = tp.provider_rating_stats?.total_reviews ?? 0;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0">
      {/* Avatar */}
      <div className="relative size-11 rounded-full overflow-hidden bg-neutral-100 shrink-0 ring-2 ring-neutral-100">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`Photo of ${name}`}
            fill
            className="object-cover"
            sizes="44px"
          />
        ) : (
          <div className="size-full flex items-center justify-center bg-brand-primary/10">
            <User className="size-4 text-brand-primary" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-semibold text-neutral-900 truncate">{tp.business_name}</p>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Wrench className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{primaryService(tp.services)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Star
            className="size-3 shrink-0 text-brand-secondary fill-brand-secondary"
            aria-hidden="true"
          />
          <span className="font-medium text-neutral-700">{formatRating(rating)}</span>
          {reviewCount > 0 && (
            <span className="text-neutral-400">({reviewCount})</span>
          )}
        </div>
      </div>

      {/* Link */}
      <Link
        href={`/services/tradespeople/${tp.slug}`}
        className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-colors min-h-[44px] flex items-center justify-center"
        aria-label={`View profile for ${tp.business_name}`}
      >
        View
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export async function RecommendedTradespeople({ postcode }: Props) {
  const tradespeople = await fetchTradespeople(postcode);

  if (tradespeople.length === 0) return null;

  return (
    <section
      aria-labelledby="recommended-trades-heading"
      className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-1 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2
            id="recommended-trades-heading"
            className="text-sm font-semibold text-neutral-900"
          >
            Local Experts
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Verified professionals near this property
          </p>
        </div>
        <Link
          href={`/services/tradespeople?postcode=${encodeURIComponent(postcode)}`}
          className="flex items-center gap-1 text-xs text-brand-primary hover:underline"
          aria-label="Browse all local tradespeople"
        >
          Browse all
          <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </div>

      <div>
        {tradespeople.map((tp) => (
          <TradespersonCard key={tp.user_id} tp={tp} />
        ))}
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Star, Wrench, User, ShieldCheck } from "lucide-react";
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

/** Extract the postcode district prefix, e.g. "TW7 9AB" → "TW7" */
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

  if (error || !data || data.length === 0) {
    return [];
  }

  return data as unknown as TradespersonRow[];
}

// ---------------------------------------------------------------------------
// Card sub-component — Stitch "Local Experts" design
// ---------------------------------------------------------------------------

function TradespersonCard({ tp }: Readonly<{ tp: TradespersonRow }>) {
  const avatarUrl = tp.profiles?.avatar_url ?? null;
  const rating = tp.provider_rating_stats?.average_rating ?? null;
  const reviewCount = tp.provider_rating_stats?.total_reviews ?? 0;
  const ratingStars = rating ? Math.round(rating) : 0;

  return (
    <div className="bg-white p-5 rounded-2xl flex flex-col gap-4 shadow-sm border border-[#eeeeed]">
      {/* Header: icon + verified badge */}
      <div className="flex justify-between items-start">
        <div className="size-12 rounded-full bg-[#f4f3f2] flex items-center justify-center overflow-hidden shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`Photo of ${tp.business_name}`}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <Wrench className="size-5 text-[#1B4D3E]" />
          )}
        </div>
        <span className="flex items-center gap-1 bg-[#1B4D3E]/10 text-[#1B4D3E] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase">
          <ShieldCheck className="size-3" />
          Verified
        </span>
      </div>

      {/* Name + rating */}
      <div className="flex-1">
        <h4 className="text-base font-heading font-bold text-[#1B4D3E] mb-1">
          {tp.business_name}
        </h4>
        <p className="text-xs text-[#707974] mb-3">{primaryService(tp.services)}</p>
        <div className="flex items-center gap-2">
          <div className="flex text-[#D4A853]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="size-3.5"
                fill={i < ratingStars ? "currentColor" : "none"}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-[#707974] uppercase tracking-widest">
            {reviewCount > 0 ? `${reviewCount} Reviews` : "New"}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/services/tradespeople/${tp.slug}`}
        className="w-full py-3 bg-[#1B4D3E] text-white rounded-xl font-bold text-xs uppercase tracking-widest text-center hover:bg-[#003629] transition-colors"
      >
        Get Quote
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
    <section aria-labelledby="recommended-trades-heading" className="space-y-4">
      <div>
        <h2
          id="recommended-trades-heading"
          className="text-sm font-heading font-bold text-[#1B4D3E] uppercase tracking-wider"
        >
          Local Experts
        </h2>
        <p className="text-xs text-[#707974] mt-0.5">
          Verified professionals near this property
        </p>
      </div>

      <div className="space-y-3">
        {tradespeople.map((tp) => (
          <TradespersonCard key={tp.user_id} tp={tp} />
        ))}
      </div>
    </section>
  );
}

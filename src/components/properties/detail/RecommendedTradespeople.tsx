import Image from "next/image";
import Link from "next/link";
import { Star, Wrench, User } from "lucide-react";
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

  // Use postcode district prefix-match on service_postcodes array element.
  // Supabase PostgREST supports array contains (@>) but not LIKE on array
  // elements. We use `cs` (contains) won't work for partial match.
  // Instead: fetch providers whose service_postcodes contains the full
  // postcode, falling back to district prefix using .or() filter.
  // The most reliable approach without a custom RPC is to query providers
  // that have the postcode district as a service_postcodes entry, or where
  // their stored postcodes start with the district prefix.
  // We use textSearch isn't available on arrays, so we query all verified
  // providers ordered by proximity and limit server-side with RLS anon read.
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
    // Fallback: try matching on the first two chars (area code only) won't
    // narrow well. Return empty — section will be hidden.
    return [];
  }

  return data as unknown as TradespersonRow[];
}

// ---------------------------------------------------------------------------
// Card sub-component
// ---------------------------------------------------------------------------

function TradespersonCard({ tp }: Readonly<{ tp: TradespersonRow }>) {
  const name =
    tp.profiles?.full_name ?? tp.business_name;
  const avatarUrl = tp.profiles?.avatar_url ?? null;
  const rating = tp.provider_rating_stats?.average_rating ?? null;
  const reviewCount = tp.provider_rating_stats?.total_reviews ?? 0;

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      {/* Avatar */}
      <div className="relative size-10 rounded-full overflow-hidden bg-muted shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`Photo of ${name}`}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="size-full flex items-center justify-center">
            <User className="size-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-semibold truncate">{tp.business_name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Wrench className="size-3 shrink-0" />
          <span className="truncate">{primaryService(tp.services)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Star
            className="size-3 shrink-0"
            style={{ color: "var(--brand-secondary, #D4A853)", fill: "var(--brand-secondary, #D4A853)" }}
          />
          <span className="font-medium">{formatRating(rating)}</span>
          {reviewCount > 0 && (
            <span className="text-muted-foreground">({reviewCount})</span>
          )}
        </div>
      </div>

      {/* Link */}
      <Link
        href={`/tradespeople/${tp.slug}`}
        className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold border border-[color:var(--brand-primary,#1B4D3E)] text-[color:var(--brand-primary,#1B4D3E)] hover:bg-[color:var(--brand-primary,#1B4D3E)] hover:text-white transition-colors"
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
    <section aria-labelledby="recommended-trades-heading" className="rounded-xl border bg-card p-5 space-y-3">
      <h2
        id="recommended-trades-heading"
        className="text-sm font-semibold text-foreground"
      >
        Local Tradespeople
      </h2>
      <p className="text-xs text-muted-foreground -mt-1">
        Verified professionals near this property
      </p>

      <div className="divide-y divide-border">
        {tradespeople.map((tp) => (
          <TradespersonCard key={tp.user_id} tp={tp} />
        ))}
      </div>
    </section>
  );
}

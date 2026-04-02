import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentProfile } from "@/types/seller";

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

function PageSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-40 mt-2" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

async function PageContent({ params }: Props) {
  try {
    const { id } = await params;
    const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, metadata")
    .eq("id", id)
    .maybeSingle();

  if (!profile) redirect("/dashboard/seller/agents");

  const meta = (profile.metadata ?? {}) as Record<string, unknown>;
  const agent: AgentProfile = {
    id: profile.id,
    full_name: profile.full_name ?? "Estate Agent",
    agency_name: (meta.agency_name as string | undefined) ?? "Independent Agent",
    avatar_url: profile.avatar_url,
    areas_covered: (meta.areas_covered as string[] | undefined) ?? [],
    fee_percentage: (meta.fee_percentage as number | undefined) ?? null,
    average_rating: (meta.average_rating as number | undefined) ?? null,
    review_count: (meta.review_count as number | undefined) ?? 0,
    sold_count: (meta.sold_count as number | undefined) ?? 0,
    average_days_to_sell: (meta.average_days_to_sell as number | undefined) ?? null,
    bio: (meta.bio as string | undefined) ?? null,
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/seller/agents" className="flex items-center gap-2 text-sm text-[--color-on-surface-variant] hover:text-on-surface">
          <ArrowLeft size={16} />
          Find Agent
        </Link>
        <h1 className="text-2xl font-bold text-on-surface font-['Plus_Jakarta_Sans'] mt-2">Agent Profile</h1>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-[--color-outline-variant] p-8">
        <div className="flex items-start gap-6">
          {agent.avatar_url ? (
            <Image src={agent.avatar_url} alt={agent.full_name} width={80} height={80} className="rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#1B4D3E]/20 to-[#D4A853]/20 flex items-center justify-center text-[#1B4D3E] font-bold text-3xl flex-shrink-0">
              {agent.full_name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-on-surface font-['Plus_Jakarta_Sans']">{agent.full_name}</h2>
            <p className="text-[--color-on-surface-variant] mt-0.5">{agent.agency_name}</p>
            {agent.average_rating !== null && (
              <div className="flex items-center gap-1.5 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16}
                    className={i < Math.round(agent.average_rating!) ? "text-[#D4A853] fill-[#D4A853]" : "text-[--color-outline-variant]"} />
                ))}
                <span className="text-sm text-[--color-on-surface-variant] ml-1">
                  {agent.average_rating.toFixed(1)} ({agent.review_count} reviews)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[--color-outline-variant]">
          {agent.fee_percentage !== null && (
            <div className="text-center">
              <p className="text-2xl font-extrabold text-on-surface">{agent.fee_percentage}%</p>
              <p className="text-xs text-[--color-on-surface-variant] mt-0.5">Commission Fee</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-2xl font-extrabold text-on-surface">{agent.sold_count}</p>
            <p className="text-xs text-[--color-on-surface-variant] mt-0.5">Sold Last Year</p>
          </div>
          {agent.average_days_to_sell !== null && (
            <div className="text-center">
              <p className="text-2xl font-extrabold text-on-surface">{agent.average_days_to_sell}</p>
              <p className="text-xs text-[--color-on-surface-variant] mt-0.5">Avg Days to Sell</p>
            </div>
          )}
        </div>

        {agent.areas_covered.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[--color-outline-variant]">
            <p className="text-xs font-semibold text-[--color-on-surface-variant] mb-2">Areas Covered</p>
            <div className="flex flex-wrap gap-2">
              {agent.areas_covered.map((area) => (
                <span key={area} className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-[--color-surface-container-low] text-[--color-on-surface-variant]">
                  <MapPin size={10} />{area}
                </span>
              ))}
            </div>
          </div>
        )}

        {agent.bio && (
          <div className="mt-6 pt-6 border-t border-[--color-outline-variant]">
            <p className="text-xs font-semibold text-[--color-on-surface-variant] mb-2">About</p>
            <p className="text-sm text-[--color-on-surface-variant] leading-relaxed">{agent.bio}</p>
          </div>
        )}
      </div>

      <div className="bg-[#1B4D3E] rounded-2xl p-8 text-white">
        <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans']">Request a Valuation</h3>
        <p className="text-white/70 mt-2 text-sm">
          {agent.full_name} will visit your property and provide a professional market appraisal.
        </p>
        <div className="flex gap-3 mt-6">
          <a
            href={`mailto:valuation@britestate.co.uk?subject=Valuation Request - ${encodeURIComponent(agent.full_name)}`}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1B4D3E] text-sm font-bold hover:bg-white/90 active:scale-95 transition-all shadow-lg"
          >
            <Mail size={16} />
            Request Valuation
          </a>
          <Link
            href={`/dashboard/seller/agents/compare?ids=${id}`}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Compare
          </Link>
        </div>
      </div>
    </div>
    );
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-on-surface">Agent Profile</h1>
        <p className="text-sm text-[--color-on-surface-variant]">Unable to load agent profile. Please try refreshing the page.</p>
      </div>
    );
  }
}

export default function AgentProfilePage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}

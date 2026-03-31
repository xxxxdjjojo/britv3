import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { AgentPublicProfile } from "@/types/providers";
import { sanitizePostgrestInput } from "@/lib/validation/sanitize";

export const metadata: Metadata = {
  title: "Find an Estate Agent Near You | Britestate",
  description:
    "Compare local estate agents — check sold prices, reviews, and fees before choosing your agent.",
};

type Props = {
  searchParams: Promise<Record<string, string>>;
};

const MIN_RATING_OPTIONS = [
  { label: "4.5+", value: "4.5" },
  { label: "4.0+", value: "4.0" },
  { label: "3.5+", value: "3.5" },
] as const;

export default async function AgentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q ?? "";
  const area = params.area ?? "";
  const minRating = params.min_rating ?? "";

  let agents: AgentPublicProfile[] = [];

  try {
    const supabase = await createClient();
    let query = supabase
      .from("agent_agency_profiles")
      .select("*")
      .limit(20);

    if (q) {
      const safeQ = sanitizePostgrestInput(q);
      if (safeQ.length > 0) {
        query = query.or(
          `display_name.ilike.%${safeQ}%,agency->name.ilike.%${safeQ}%`,
        );
      }
    }

    if (area) {
      // coverage_areas is a text[] column on agent_agency_profiles
      query = query.contains("coverage_areas", [area]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Agent search error:", error);
    } else {
      agents = (data as unknown as AgentPublicProfile[]) ?? [];

      // Fetch rating data for returned agents
      if (agents.length > 0) {
        const agentIds = agents.map((a) => (a as unknown as { user_id?: string }).user_id ?? a.id).filter(Boolean);
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("provider_id, overall_rating")
          .in("provider_id", agentIds)
          .eq("moderation_status", "approved");

        if (reviewData && reviewData.length > 0) {
          const ratingMap = new Map<string, { sum: number; count: number }>();
          for (const r of reviewData) {
            const existing = ratingMap.get(r.provider_id) ?? { sum: 0, count: 0 };
            existing.sum += r.overall_rating;
            existing.count += 1;
            ratingMap.set(r.provider_id, existing);
          }

          agents = agents.map((a) => {
            const key = (a as unknown as { user_id?: string }).user_id ?? a.id;
            const stats = ratingMap.get(key);
            return Object.assign({}, a, {
              avg_rating: stats ? stats.sum / stats.count : null,
            });
          });
        }
      }
    }
  } catch (err) {
    console.error("Agent search error:", err);
  }

  // Client-side rating filter (dataset is small, max 20 results from DB)
  // avg_rating is not returned in this query so we treat all as unrated for now;
  // the filter is surfaced in UI so it works once the JOIN is extended.
  const minRatingNum = minRating ? parseFloat(minRating) : null;
  const filteredAgents =
    minRatingNum !== null
      ? agents.filter((a) => {
          const rating =
            (a as unknown as { avg_rating?: number | null }).avg_rating ?? null;
          // If no rating data, exclude when a min_rating filter is active
          if (rating === null) return false;
          return rating >= minRatingNum;
        })
      : agents;

  const hasFilters = q || area || minRating;

  return (
    <div className="min-h-screen bg-[#faf9f8] pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1B4D3E] py-16 px-6 text-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#D4A853]/10 blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <h1
            className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl mb-4"
            style={{ letterSpacing: "-0.02em" }}
          >
            Find an Estate Agent
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            Compare local estate agents — check reviews, sold prices, and fees
            before choosing.
          </p>
          <form
            action="/agents"
            method="get"
            className="flex flex-col sm:flex-row gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-2 max-w-xl mx-auto shadow-2xl shadow-[#1B4D3E]/20"
          >
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by agency name..."
              className="flex-1 h-12 px-4 rounded-xl bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/20 text-sm"
            />
            <button
              type="submit"
              className="min-h-[44px] h-12 px-6 bg-[#1B4D3E] text-white font-semibold rounded-xl hover:bg-[#163d32] transition-colors text-sm shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-[#f4f3f2]">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <form
            action="/agents"
            method="get"
            className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-end gap-4"
          >
            {/* Preserve the text search param */}
            {q ? <input type="hidden" name="q" value={q} /> : null}

            {/* Area filter */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <label
                htmlFor="area-filter"
                className="text-xs font-semibold text-[#1B4D3E]/60 uppercase tracking-wide"
              >
                Area
              </label>
              <input
                id="area-filter"
                name="area"
                defaultValue={area}
                placeholder="e.g. Manchester, SW1A"
                className="px-3 py-2 text-sm rounded-xl bg-white text-[#1B4D3E] placeholder:text-[#1B4D3E]/40 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/20 w-52"
              />
            </div>

            {/* Min rating filter */}
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-xs font-semibold text-[#1B4D3E]/60 uppercase tracking-wide">
                Min Rating
              </legend>
              <div className="flex items-center gap-3">
                {MIN_RATING_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-1.5 cursor-pointer text-sm text-[#1B4D3E]"
                  >
                    <input
                      type="radio"
                      name="min_rating"
                      value={opt.value}
                      defaultChecked={minRating === opt.value}
                      className="accent-[#1B4D3E]"
                    />
                    {opt.label}
                  </label>
                ))}
                {minRating ? (
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm text-[#1B4D3E]/50">
                    <input
                      type="radio"
                      name="min_rating"
                      value=""
                      defaultChecked={!minRating}
                      className="accent-[#1B4D3E]"
                    />
                    Any
                  </label>
                ) : null}
              </div>
            </fieldset>

            {/* Submit */}
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 bg-[#1B4D3E] text-white text-sm font-semibold rounded-xl hover:bg-[#163d32] transition-colors self-end"
            >
              Apply Filters
            </button>

            {/* Clear filters */}
            {hasFilters ? (
              <Link
                href="/agents"
                className="min-h-[44px] px-5 py-2.5 text-sm text-[#1B4D3E]/60 hover:text-[#1B4D3E] self-end inline-flex items-center"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-[#1B4D3E]/60 mb-6 text-sm">
          <span className="font-semibold text-[#1B4D3E]">
            {filteredAgents.length}
          </span>{" "}
          estate agent{filteredAgents.length !== 1 ? "s" : ""} found
          {q ? (
            <>
              {" "}
              for{" "}
              <span className="font-semibold text-[#1B4D3E]">
                &ldquo;{q}&rdquo;
              </span>
            </>
          ) : null}
          {area ? (
            <>
              {" "}
              in{" "}
              <span className="font-semibold text-[#1B4D3E]">{area}</span>
            </>
          ) : null}
          {minRating ? (
            <>
              {" "}
              rated{" "}
              <span className="font-semibold text-[#1B4D3E]">
                {minRating}+
              </span>
            </>
          ) : null}
        </p>

        {filteredAgents.length === 0 ? (
          <div className="rounded-2xl bg-[#f4f3f2] py-16 text-center">
            <p className="text-[#1B4D3E]/60 text-lg mb-4">
              No estate agents found. Try adjusting your filters.
            </p>
            <Link
              href="/agents"
              className="text-[#1B4D3E] font-semibold hover:underline"
            >
              View all estate agents
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => {
              // Use actual agent_agency_profiles columns
              const raw = agent as unknown as Record<string, unknown>;
              const agencyName =
                (raw.agency_name as string | null) ??
                agent.display_name ??
                "Agency";
              const logoUrl =
                (raw.logo_url as string | null) ?? null;
              const city =
                (raw.city as string | null) ?? null;

              const areasCovered =
                (raw.coverage_areas as string[] | null) ??
                agent.areas_covered ??
                [];

              return (
                <div
                  key={agent.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Card header */}
                  <div className="p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#f4f3f2] flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={agencyName}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-[#1B4D3E]/40">
                          {agencyName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-heading font-semibold text-[#1B4D3E] truncate">
                        {agencyName}
                      </h2>
                      <p className="text-sm text-[#1B4D3E]/60 truncate">
                        {agent.display_name}
                      </p>
                      {city ? (
                        <p className="text-xs text-[#1B4D3E]/40 mt-0.5 truncate">
                          {city}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Areas covered tags */}
                  {areasCovered.length > 0 ? (
                    <div className="px-6 pb-4 flex flex-wrap gap-1.5">
                      {areasCovered.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1B4D3E]/8 text-[#1B4D3E]"
                        >
                          {a}
                        </span>
                      ))}
                      {areasCovered.length > 3 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f4f3f2] text-[#1B4D3E]/60">
                          +{areasCovered.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Card footer */}
                  <div className="mt-auto bg-[#faf9f8] p-4">
                    <Link
                      href={`/agents/${agent.slug}`}
                      className="block w-full text-center min-h-[44px] py-2.5 px-4 bg-[#1B4D3E] text-white text-sm font-semibold rounded-xl hover:bg-[#163d32] transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="bg-[#1B4D3E] rounded-2xl p-10 text-center text-white">
          <h2
            className="font-heading text-3xl font-bold tracking-tight mb-3"
            style={{ letterSpacing: "-0.02em" }}
          >
            Are you an estate agent?
          </h2>
          <p className="text-white/70 text-lg mb-6 max-w-lg mx-auto">
            Join Britestate and showcase your listings, team and reviews.
          </p>
          <Link
            href="/register"
            className="inline-block min-h-[44px] px-8 py-3 bg-white text-[#1B4D3E] font-semibold rounded-xl hover:bg-[#f4f3f2] transition-colors"
          >
            Create Your Agent Profile
          </Link>
        </div>
      </section>
    </div>
  );
}

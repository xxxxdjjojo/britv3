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
      .select(
        `
        *,
        profiles (
          id,
          avatar_url,
          full_name,
          email
        )
      `,
      )
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
      // areas_covered is a text[] column — use the overlap/contains approach
      // cs (contains) works for array columns in Supabase PostgREST
      query = query.contains("areas_covered", [area]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Agent search error:", error);
    } else {
      agents = (data as unknown as AgentPublicProfile[]) ?? [];
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B4D3E] to-[#2563EB] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Find an Estate Agent</h1>
          <p className="text-lg text-white/80 mb-8">
            Compare local estate agents — check reviews, sold prices, and fees
            before choosing.
          </p>
          <form
            action="/agents"
            method="get"
            className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
          >
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by agency name..."
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-[#1B4D3E] font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-gray-200 bg-white shadow-sm">
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
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                Area
              </label>
              <input
                id="area-filter"
                name="area"
                defaultValue={area}
                placeholder="e.g. Manchester, SW1A"
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent w-52"
              />
            </div>

            {/* Min rating filter */}
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Min Rating
              </legend>
              <div className="flex items-center gap-3">
                {MIN_RATING_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700"
                  >
                    <input
                      type="radio"
                      name="min_rating"
                      value={opt.value}
                      defaultChecked={minRating === opt.value}
                      className="accent-[#2563EB]"
                    />
                    {opt.label}
                  </label>
                ))}
                {minRating ? (
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-400">
                    <input
                      type="radio"
                      name="min_rating"
                      value=""
                      defaultChecked={!minRating}
                      className="accent-[#2563EB]"
                    />
                    Any
                  </label>
                ) : null}
              </div>
            </fieldset>

            {/* Submit */}
            <button
              type="submit"
              className="px-5 py-2 bg-[#1B4D3E] text-white text-sm font-semibold rounded-lg hover:bg-[#163d32] transition-colors self-end"
            >
              Apply Filters
            </button>

            {/* Clear filters */}
            {hasFilters ? (
              <Link
                href="/agents"
                className="px-5 py-2 text-sm text-gray-500 hover:text-gray-700 self-end"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-gray-600 mb-6">
          <span className="font-semibold text-gray-900">
            {filteredAgents.length}
          </span>{" "}
          estate agent{filteredAgents.length !== 1 ? "s" : ""} found
          {q ? (
            <>
              {" "}
              for{" "}
              <span className="font-semibold text-gray-900">
                &ldquo;{q}&rdquo;
              </span>
            </>
          ) : null}
          {area ? (
            <>
              {" "}
              in{" "}
              <span className="font-semibold text-gray-900">{area}</span>
            </>
          ) : null}
          {minRating ? (
            <>
              {" "}
              rated{" "}
              <span className="font-semibold text-gray-900">
                {minRating}+
              </span>
            </>
          ) : null}
        </p>

        {filteredAgents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">
              No estate agents found. Try adjusting your filters.
            </p>
            <Link
              href="/agents"
              className="text-[#2563EB] font-semibold hover:underline"
            >
              View all estate agents
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => {
              const agencyName =
                (agent.agency as { name?: string } | null)?.name ??
                agent.display_name;
              const logoUrl =
                (agent.agency as { logo_url?: string | null } | null)
                  ?.logo_url ??
                (
                  agent.profiles as
                    | { avatar_url?: string | null }
                    | null
                )?.avatar_url ??
                null;
              const city =
                (agent.agency as { address?: string | null } | null)
                  ?.address ?? null;

              const areasCovered = agent.areas_covered ?? [];

              return (
                <div
                  key={agent.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Card header */}
                  <div className="p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={agencyName}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-gray-400">
                          {agencyName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-900 truncate">
                        {agencyName}
                      </h2>
                      <p className="text-sm text-gray-500 truncate">
                        {agent.display_name}
                      </p>
                      {city ? (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
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
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                        >
                          {a}
                        </span>
                      ))}
                      {areasCovered.length > 3 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          +{areasCovered.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Card footer */}
                  <div className="mt-auto border-t border-gray-100 p-4">
                    <Link
                      href={`/agents/${agent.slug}`}
                      className="block w-full text-center py-2 px-4 bg-[#1B4D3E] text-white text-sm font-semibold rounded-xl hover:bg-[#163d32] transition-colors"
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
        <div className="bg-gradient-to-r from-[#1B4D3E] to-[#2563EB] rounded-2xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Are you an estate agent?</h2>
          <p className="text-white/80 text-lg mb-6">
            Join Britestate and showcase your listings, team and reviews.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-[#1B4D3E] font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Create Your Agent Profile
          </Link>
        </div>
      </section>
    </div>
  );
}

/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
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
    <div className="min-h-screen bg-surface pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-primary-dark to-brand-primary text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl font-bold mb-4">Find an Estate Agent</h1>
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
              className="flex-1 px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-brand-primary font-semibold rounded-xl hover:bg-muted transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-white shadow-sm">
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
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Area
              </label>
              <input
                id="area-filter"
                name="area"
                defaultValue={area}
                placeholder="e.g. Manchester, SW1A"
                className="px-3 py-2 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent w-52"
              />
            </div>

            {/* Min rating filter */}
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Min Rating
              </legend>
              <div className="flex items-center gap-3">
                {MIN_RATING_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-1.5 cursor-pointer text-sm text-foreground"
                  >
                    <input
                      type="radio"
                      name="min_rating"
                      value={opt.value}
                      defaultChecked={minRating === opt.value}
                      className="accent-brand-primary"
                    />
                    {opt.label}
                  </label>
                ))}
                {minRating ? (
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm text-muted-foreground">
                    <input
                      type="radio"
                      name="min_rating"
                      value=""
                      defaultChecked={!minRating}
                      className="accent-brand-primary"
                    />
                    Any
                  </label>
                ) : null}
              </div>
            </fieldset>

            {/* Submit */}
            <button
              type="submit"
              className="px-5 py-2 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors self-end"
            >
              Apply Filters
            </button>

            {/* Clear filters */}
            {hasFilters ? (
              <Link
                href="/agents"
                className="px-5 py-2 text-sm text-muted-foreground hover:text-foreground self-end"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-muted-foreground mb-6">
          <span className="font-semibold text-foreground">
            {filteredAgents.length}
          </span>{" "}
          estate agent{filteredAgents.length !== 1 ? "s" : ""} found
          {q ? (
            <>
              {" "}
              for{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{q}&rdquo;
              </span>
            </>
          ) : null}
          {area ? (
            <>
              {" "}
              in{" "}
              <span className="font-semibold text-foreground">{area}</span>
            </>
          ) : null}
          {minRating ? (
            <>
              {" "}
              rated{" "}
              <span className="font-semibold text-foreground">
                {minRating}+
              </span>
            </>
          ) : null}
        </p>

        {filteredAgents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              No estate agents found. Try adjusting your filters.
            </p>
            <Link
              href="/agents"
              className="text-brand-primary font-semibold hover:underline"
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
                  className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Card header */}
                  <div className="p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={agencyName}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-muted-foreground">
                          {agencyName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-foreground truncate">
                        {agencyName}
                      </h2>
                      <p className="text-sm text-muted-foreground truncate">
                        {agent.display_name}
                      </p>
                      {city ? (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
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
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary"
                        >
                          {a}
                        </span>
                      ))}
                      {areasCovered.length > 3 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          +{areasCovered.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Card footer */}
                  <div className="mt-auto border-t border-border p-4">
                    <Link
                      href={`/agents/${agent.slug}`}
                      className="block w-full text-center py-2 px-4 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary-dark transition-colors"
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
        <div className="bg-gradient-to-r from-brand-primary-dark to-brand-primary rounded-2xl p-10 text-center text-white">
          <h2 className="font-heading text-3xl font-bold mb-3">Are you an estate agent?</h2>
          <p className="text-white/80 text-lg mb-6">
            Join Britestate and showcase your listings, team and reviews.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-brand-primary font-semibold rounded-xl hover:bg-muted transition-colors"
          >
            Create Your Agent Profile
          </Link>
        </div>
      </section>
    </div>
  );
}

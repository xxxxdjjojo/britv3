import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { sanitizePostgrestInput } from "@/lib/validation/sanitize";
import { Search, MapPin, Star, ArrowRight, UserPlus, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Find a Letting Agent Near You | Britestate",
  description:
    "Compare local letting agents — check reviews, rental listings, and management fees before choosing your agent.",
};

type Props = {
  searchParams: Promise<Record<string, string>>;
};

type LettingAgent = {
  id: string;
  slug: string;
  display_name: string;
  agency_name?: string | null;
  logo_url?: string | null;
  city?: string | null;
  coverage_areas?: string[] | null;
  areas_covered?: string[];
  avg_rating?: number | null;
};

const SERVICE_OPTIONS = [
  { label: "Full management", value: "full_management" },
  { label: "Tenant find", value: "tenant_find" },
  { label: "Rent collection", value: "rent_collection" },
] as const;

const MIN_RATING_OPTIONS = [
  { label: "4.5+", value: "4.5" },
  { label: "4.0+", value: "4.0" },
  { label: "3.5+", value: "3.5" },
] as const;

export default async function LettingAgentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q ?? "";
  const area = params.area ?? "";
  const minRating = params.min_rating ?? "";
  const service = params.service ?? "";

  let agents: LettingAgent[] = [];

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
      query = query.contains("coverage_areas", [area]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Letting agent search error:", error);
    } else {
      agents = (data as unknown as LettingAgent[]) ?? [];

      // Fetch rating data for returned agents
      if (agents.length > 0) {
        const agentIds = agents
          .map((a) => (a as unknown as { user_id?: string }).user_id ?? a.id)
          .filter(Boolean);
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("provider_id, overall_rating")
          .in("provider_id", agentIds)
          .eq("moderation_status", "approved");

        if (reviewData && reviewData.length > 0) {
          const ratingMap = new Map<string, { sum: number; count: number }>();
          for (const r of reviewData) {
            const existing = ratingMap.get(r.provider_id) ?? {
              sum: 0,
              count: 0,
            };
            existing.sum += r.overall_rating;
            existing.count += 1;
            ratingMap.set(r.provider_id, existing);
          }

          agents = agents.map((a) => {
            const key =
              (a as unknown as { user_id?: string }).user_id ?? a.id;
            const stats = ratingMap.get(key);
            return Object.assign({}, a, {
              avg_rating: stats ? stats.sum / stats.count : null,
            });
          });
        }
      }
    }
  } catch (err) {
    console.error("Letting agent search error:", err);
  }

  // Client-side rating filter
  const minRatingNum = minRating ? parseFloat(minRating) : null;
  const filteredAgents =
    minRatingNum !== null
      ? agents.filter((a) => {
          const rating = a.avg_rating ?? null;
          if (rating === null) return false;
          return rating >= minRatingNum;
        })
      : agents;

  const hasFilters = q || area || minRating || service;

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-brand-primary to-brand-primary-dark py-20 px-6">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-secondary/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm">
            <Home className="h-4 w-4" />
            Lettings Specialists
          </span>
          <h1
            className="font-heading text-4xl font-bold text-white sm:text-5xl"
            style={{ letterSpacing: "-0.02em" }}
          >
            Find &amp; Compare Letting Agents
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
            Compare local letting agents — check reviews, rental portfolios, and
            management fees before choosing.
          </p>

          {/* Search bar */}
          <form
            action="/letting-agents"
            method="get"
            className="mt-8 flex flex-col sm:flex-row gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-2 max-w-xl mx-auto shadow-2xl shadow-brand-primary/20"
          >
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by agency name..."
                className="flex-1 h-12 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none"
                aria-label="Search by agency name"
              />
            </div>
            <button
              type="submit"
              className="h-12 rounded-xl bg-brand-primary px-6 text-sm font-semibold text-white hover:bg-brand-primary/90 active:scale-95 transition-all shrink-0 min-w-[44px]"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-surface-container-low">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <form
            action="/letting-agents"
            method="get"
            className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-end gap-4"
          >
            {q ? <input type="hidden" name="q" value={q} /> : null}

            {/* Area filter */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <label
                htmlFor="area-filter"
                className="text-xs font-semibold text-brand-primary/50 uppercase tracking-wide"
              >
                Area
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-primary/40" />
                <input
                  id="area-filter"
                  name="area"
                  defaultValue={area}
                  placeholder="e.g. London, SW1A"
                  className="pl-8 pr-3 py-2 text-sm rounded-xl bg-surface text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-52"
                />
              </div>
            </div>

            {/* Service filter */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <label
                htmlFor="service-filter"
                className="text-xs font-semibold text-brand-primary/50 uppercase tracking-wide"
              >
                Service
              </label>
              <select
                id="service-filter"
                name="service"
                defaultValue={service}
                className="px-3 py-2 text-sm rounded-xl bg-surface text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-52"
              >
                <option value="">All services</option>
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Min rating filter */}
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-xs font-semibold text-brand-primary/50 uppercase tracking-wide">
                Min Rating
              </legend>
              <div className="flex items-center gap-3">
                {MIN_RATING_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-1.5 cursor-pointer text-sm text-brand-primary"
                  >
                    <input
                      type="radio"
                      name="min_rating"
                      value={opt.value}
                      defaultChecked={minRating === opt.value}
                      className="accent-brand-primary"
                    />
                    <Star className="h-3 w-3 fill-brand-secondary text-brand-secondary" />
                    {opt.label}
                  </label>
                ))}
                {minRating ? (
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm text-brand-primary/40">
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
              className="px-5 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 active:scale-95 transition-all self-end min-h-[44px]"
            >
              Apply Filters
            </button>

            {/* Clear */}
            {hasFilters ? (
              <Link
                href="/letting-agents"
                className="px-4 py-2.5 text-sm text-brand-primary/50 hover:text-brand-primary self-end min-h-[44px] flex items-center"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-brand-primary/60 mb-8 text-sm">
          <span className="font-semibold text-brand-primary">
            {filteredAgents.length}
          </span>{" "}
          letting agent{filteredAgents.length !== 1 ? "s" : ""} found
          {q ? (
            <>
              {" "}
              for{" "}
              <span className="font-semibold text-brand-primary">
                &ldquo;{q}&rdquo;
              </span>
            </>
          ) : null}
          {area ? (
            <>
              {" "}
              in{" "}
              <span className="font-semibold text-brand-primary">{area}</span>
            </>
          ) : null}
          {minRating ? (
            <>
              {" "}
              rated{" "}
              <span className="font-semibold text-brand-primary">
                {minRating}+
              </span>
            </>
          ) : null}
        </p>

        {filteredAgents.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-low py-20 text-center">
            <p className="font-heading font-semibold text-brand-primary text-lg">
              No letting agents found
            </p>
            <p className="text-brand-primary/50 mt-2 mb-6">
              Try adjusting your filters or search terms.
            </p>
            <Link
              href="/letting-agents"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
            >
              View all letting agents
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAgents.map((agent) => {
              const agencyName = agent.agency_name ?? agent.display_name ?? "Agency";
              const logoUrl = agent.logo_url ?? null;
              const city = agent.city ?? null;
              const avgRating = agent.avg_rating ?? null;
              const areasCovered = agent.coverage_areas ?? agent.areas_covered ?? [];

              return (
                <div
                  key={agent.id}
                  className="bg-surface rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
                >
                  {/* Card header */}
                  <div className="p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={agencyName}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-brand-primary/30">
                          {agencyName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2
                        className="font-heading font-semibold text-brand-primary truncate"
                        style={{ letterSpacing: "-0.01em" }}
                      >
                        {agencyName}
                      </h2>
                      <p className="text-sm text-brand-primary/60 truncate mt-0.5">
                        {agent.display_name}
                      </p>
                      {city ? (
                        <p className="text-xs text-brand-primary/40 mt-0.5 truncate">
                          {city}
                        </p>
                      ) : null}
                      {avgRating !== null ? (
                        <div className="mt-1 flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-brand-secondary text-brand-secondary" />
                          <span className="text-xs font-semibold text-brand-primary">
                            {avgRating.toFixed(1)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Letting badge */}
                  <div className="px-6 pb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/10 text-brand-secondary">
                      Lettings Specialist
                    </span>
                  </div>

                  {/* Areas covered */}
                  {areasCovered.length > 0 ? (
                    <div className="px-6 pb-4 flex flex-wrap gap-1.5">
                      {areasCovered.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-primary-lighter text-brand-primary"
                        >
                          {a}
                        </span>
                      ))}
                      {areasCovered.length > 3 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-low text-brand-primary/50">
                          +{areasCovered.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Card footer */}
                  <div className="mt-auto bg-surface-container-low p-4">
                    <Link
                      href={`/letting-agents/${agent.slug}`}
                      className="flex items-center justify-center w-full py-2.5 px-4 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 active:scale-95 transition-all min-h-[44px]"
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
      <section className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-brand-primary to-brand-primary-dark p-10 text-center text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-secondary/10 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
            <h2
              className="font-heading text-3xl font-bold"
              style={{ letterSpacing: "-0.02em" }}
            >
              Are you a letting agent?
            </h2>
            <p className="text-white/70 text-lg mt-3 mb-7">
              Join Britestate and showcase your rental portfolio, team and
              reviews.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-surface-container-lowest px-8 py-3.5 font-semibold text-brand-primary hover:bg-surface-container-low active:scale-95 transition-all"
            >
              Create Your Agent Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

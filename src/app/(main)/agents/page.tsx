import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { AgentPublicProfile } from "@/types/providers";

export const metadata: Metadata = {
  title: "Find an Estate Agent Near You | Britestate",
  description:
    "Compare local estate agents — check sold prices, reviews, and fees before choosing your agent.",
};

type Props = {
  searchParams: Promise<Record<string, string>>;
};

export default async function AgentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q ?? "";

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
      query = query.or(`display_name.ilike.%${q}%,agency->name.ilike.%${q}%`);
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
              placeholder="Search by agency name or area..."
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

      {/* Results */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-gray-600 mb-6">
          <span className="font-semibold text-gray-900">{agents.length}</span>{" "}
          estate agent{agents.length !== 1 ? "s" : ""} found
          {q ? (
            <>
              {" "}
              for{" "}
              <span className="font-semibold text-gray-900">
                &ldquo;{q}&rdquo;
              </span>
            </>
          ) : null}
        </p>

        {agents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">
              No estate agents found. Try a different search.
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
            {agents.map((agent) => {
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

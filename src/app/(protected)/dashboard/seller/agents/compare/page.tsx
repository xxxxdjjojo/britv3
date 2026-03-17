import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { AgentProfile } from "@/types/seller";

type Props = Readonly<{
  searchParams: Promise<{ ids?: string }>;
}>;

export default async function AgentComparisonPage({ searchParams }: Props) {
  const { ids } = await searchParams;
  if (!ids) redirect("/dashboard/seller/agents");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const idList = ids.split(",").filter(Boolean).slice(0, 3);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, metadata")
    .in("id", idList);

  const agents: AgentProfile[] = (profiles ?? []).map((p) => {
    const meta = (p.metadata ?? {}) as Record<string, unknown>;
    return {
      id: p.id,
      full_name: p.full_name ?? "Estate Agent",
      agency_name: (meta.agency_name as string | undefined) ?? "Independent",
      avatar_url: p.avatar_url,
      areas_covered: (meta.areas_covered as string[] | undefined) ?? [],
      fee_percentage: (meta.fee_percentage as number | undefined) ?? null,
      average_rating: (meta.average_rating as number | undefined) ?? null,
      review_count: (meta.review_count as number | undefined) ?? 0,
      sold_count: (meta.sold_count as number | undefined) ?? 0,
      average_days_to_sell: (meta.average_days_to_sell as number | undefined) ?? null,
      bio: (meta.bio as string | undefined) ?? null,
    };
  });

  const rows: Array<{ label: string; getValue: (a: AgentProfile) => string }> = [
    { label: "Agency", getValue: (a) => a.agency_name },
    { label: "Fee", getValue: (a) => a.fee_percentage !== null ? `${a.fee_percentage}%` : "POA" },
    { label: "Rating", getValue: (a) => a.average_rating !== null ? `${a.average_rating.toFixed(1)} / 5` : "No reviews" },
    { label: "Reviews", getValue: (a) => String(a.review_count) },
    { label: "Sold (12 mo)", getValue: (a) => String(a.sold_count) },
    { label: "Avg Days to Sell", getValue: (a) => a.average_days_to_sell !== null ? String(a.average_days_to_sell) : "—" },
    { label: "Areas Covered", getValue: (a) => a.areas_covered.slice(0, 3).join(", ") || "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/seller/agents" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={16} />
          Find Agent
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mt-2">Agent Comparison</h1>
        <p className="text-slate-500 mt-1">Comparing {agents.length} agent{agents.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-500 px-6 py-4 w-40">Detail</th>
              {agents.map((agent) => (
                <th key={agent.id} className="text-left px-6 py-4">
                  <div className="flex items-center gap-3">
                    {agent.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={agent.avatar_url} alt={agent.full_name} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[#1B4D3E] font-bold text-sm">
                        {agent.full_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900">{agent.full_name}</p>
                      <Link href={`/dashboard/seller/agents/${agent.id}`} className="text-xs text-[#1B4D3E] hover:underline">
                        View profile
                      </Link>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, getValue }) => (
              <tr key={label} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <td className="text-xs font-semibold text-slate-500 px-6 py-3">{label}</td>
                {agents.map((agent) => (
                  <td key={agent.id} className="text-sm text-slate-700 px-6 py-3">{getValue(agent)}</td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-slate-100">
              <td className="px-6 py-4" />
              {agents.map((agent) => (
                <td key={agent.id} className="px-6 py-4">
                  <Link
                    href={`/dashboard/seller/agents/${agent.id}`}
                    className="inline-flex px-4 py-2 rounded-xl bg-[#1B4D3E] text-white text-xs font-semibold hover:bg-[#2D7A5F] transition-colors"
                  >
                    Request Valuation
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

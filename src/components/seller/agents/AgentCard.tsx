"use client";

import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import type { AgentProfile } from "@/types/seller";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  agent: AgentProfile;
  selected?: boolean;
  onToggleCompare?: (id: string) => void;
  compareCount?: number;
}>;

export function AgentCard({ agent, selected = false, onToggleCompare, compareCount = 0 }: Props) {
  const canAddToCompare = selected || compareCount < 3;

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden hover:shadow-xl",
      selected ? "border-[#1B4D3E] ring-2 ring-[#1B4D3E]/20" : "border-slate-200",
    )}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          {agent.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agent.avatar_url}
              alt={agent.full_name}
              className="h-14 w-14 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#1B4D3E]/20 to-[#D4A853]/20 flex items-center justify-center text-[#1B4D3E] font-bold text-xl flex-shrink-0">
              {agent.full_name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate">{agent.full_name}</p>
            <p className="text-sm text-slate-500 truncate">{agent.agency_name}</p>
            {agent.average_rating !== null && (
              <div className="flex items-center gap-1 mt-1">
                <Star size={12} className="text-[#D4A853] fill-[#D4A853]" />
                <span className="text-xs font-semibold text-slate-700">{agent.average_rating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({agent.review_count})</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          {agent.fee_percentage !== null && (
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-lg font-extrabold text-slate-900">{agent.fee_percentage}%</p>
              <p className="text-xs text-slate-500">Fee</p>
            </div>
          )}
          {agent.sold_count > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-lg font-extrabold text-slate-900">{agent.sold_count}</p>
              <p className="text-xs text-slate-500">Sold (12 mo)</p>
            </div>
          )}
          {agent.average_days_to_sell !== null && (
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-lg font-extrabold text-slate-900">{agent.average_days_to_sell}</p>
              <p className="text-xs text-slate-500">Avg days</p>
            </div>
          )}
        </div>

        {agent.areas_covered.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {agent.areas_covered.slice(0, 4).map((area) => (
              <span key={area} className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                <MapPin size={10} />
                {area}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 pb-6 flex gap-2">
        <Link
          href={`/dashboard/seller/agents/${agent.id}`}
          className="flex-1 py-2.5 rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold text-center hover:bg-[#2D7A5F] transition-colors"
        >
          View Profile
        </Link>
        {onToggleCompare && (
          <button
            type="button"
            onClick={() => onToggleCompare(agent.id)}
            disabled={!canAddToCompare}
            className={cn(
              "px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
              selected
                ? "border-[#1B4D3E] bg-[#1B4D3E]/10 text-[#1B4D3E]"
                : "border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-40",
            )}
          >
            {selected ? "✓ Compare" : "Compare"}
          </button>
        )}
      </div>
    </div>
  );
}

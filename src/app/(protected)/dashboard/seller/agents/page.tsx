"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AgentCard } from "@/components/seller/agents/AgentCard";
import type { AgentProfile } from "@/types/seller";

export default function FindAgentPage() {
  const [area, setArea] = useState("");
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadAgents = useCallback(async (searchArea?: string) => {
    setLoading(true);
    try {
      const params = searchArea ? `?area=${encodeURIComponent(searchArea)}` : "";
      const res = await fetch(`/api/seller/agents${params}`);
      const data = await res.json() as AgentProfile[];
      setAgents(Array.isArray(data) ? data : []);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAgents(); }, [loadAgents]);

  const toggleCompare = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-['Plus_Jakarta_Sans']">Find an Estate Agent</h1>
          <p className="text-[--color-on-surface-variant] mt-1">Compare agents in your area by fees, ratings, and performance</p>
        </div>
        {selectedIds.length >= 2 && (
          <Link
            href={`/dashboard/seller/agents/compare?ids=${selectedIds.join(",")}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-light transition-colors"
          >
            Compare {selectedIds.length} Agents <ArrowRight size={16} />
          </Link>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[--color-on-surface-variant]" />
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void loadAgents(area); }}
            placeholder="Search by area, town, or postcode prefix..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[--color-outline-variant] text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        <button
          type="button"
          onClick={() => void loadAgents(area)}
          className="px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-light transition-colors"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl border border-[--color-outline-variant] p-6 animate-pulse h-64" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-[--color-outline-variant]">
          <p className="text-[--color-on-surface-variant]">No agents found{area ? ` in "${area}"` : ""}</p>
          <p className="text-[--color-on-surface-variant] text-xs mt-1">Agents register via the agent dashboard</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              selected={selectedIds.includes(agent.id)}
              onToggleCompare={toggleCompare}
              compareCount={selectedIds.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

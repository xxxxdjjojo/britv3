"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ListingAgent } from "@/services/listings/listing-agents-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = Readonly<{
  listingId: string;
  initialAgents: Array<ListingAgent>;
}>;

// A pickable estate agent, as returned by the list_estate_agents rpc.
type AgentOption = Readonly<{
  id: string;
  label: string;
}>;

// Shape of a row returned by the list_estate_agents SECURITY DEFINER rpc.
type ListEstateAgentRow = Readonly<{
  agent_id: string;
  display_name: string | null;
  agency_name: string | null;
}>;

// ---------------------------------------------------------------------------
// AssignAgentManager
// Lets a property owner view, assign, and remove estate-agent representation
// for a listing. Assigned agents gain viewing-calendar parity (they can view
// and manage viewings on behalf of the owner).
// ---------------------------------------------------------------------------

export function AssignAgentManager({ listingId, initialAgents }: Props): React.ReactElement {
  const [agents, setAgents] = useState<ListingAgent[]>(initialAgents);
  const [pickableAgents, setPickableAgents] = useState<AgentOption[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Load pickable agents on mount so the select is ready immediately. Sourced
  // from the list_estate_agents SECURITY DEFINER rpc: user_roles SELECT RLS is
  // owner-only, so a plain cross-user query returns nothing — the rpc exposes
  // only public directory fields (name/agency) for every estate agent.
  useEffect(() => {
    let cancelled = false;
    setLoadingAgents(true);

    void (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("list_estate_agents");
      if (cancelled) return;

      if (error) {
        toast.error("Could not load estate agents list");
      } else {
        const rows = (data ?? []) as ListEstateAgentRow[];
        setPickableAgents(
          rows.map((row) => ({
            id: row.agent_id,
            label: row.display_name ?? row.agency_name ?? "Estate agent",
          })),
        );
      }

      setLoadingAgents(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Exclude agents that are already assigned.
  const assignedIds = new Set(agents.map((a) => a.agent_id));
  const availableToAssign = pickableAgents.filter((p) => !assignedIds.has(p.id));

  const handleAssign = async (): Promise<void> => {
    if (!selectedAgentId) return;
    setAssigning(true);

    try {
      const res = await fetch(`/api/listings/${listingId}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgentId }),
      });

      const data = (await res.json()) as ListingAgent[] | { error?: string };

      if (!res.ok) {
        const errMsg = (data as { error?: string }).error ?? "Failed to assign agent";
        toast.error(errMsg);
        return;
      }

      setAgents(data as ListingAgent[]);
      setSelectedAgentId("");
      toast.success("Estate agent assigned successfully");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (agentId: string): Promise<void> => {
    setRemovingId(agentId);

    try {
      const res = await fetch(
        `/api/listings/${listingId}/agents?agentId=${encodeURIComponent(agentId)}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? "Failed to remove agent");
        return;
      }

      setAgents((prev) => prev.filter((a) => a.agent_id !== agentId));
      toast.success("Estate agent removed");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estate agent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currently assigned agents */}
        {agents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No estate agent assigned. Assign one to give them viewing-calendar
            access for this listing.
          </p>
        ) : (
          <ul className="space-y-2">
            {agents.map((agent) => (
              <li
                key={agent.agent_id}
                className="flex items-center justify-between gap-2 rounded-lg border p-3"
              >
                <span className="text-sm font-medium">
                  {agent.display_name ?? "Estate Agent"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={removingId === agent.agent_id}
                  onClick={() => void handleRemove(agent.agent_id)}
                >
                  {removingId === agent.agent_id ? "Removing…" : "Remove"}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Add agent section */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Add agent
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={selectedAgentId}
              onValueChange={(v) => setSelectedAgentId(v ?? "")}
              disabled={loadingAgents || availableToAssign.length === 0}
            >
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={
                    loadingAgents
                      ? "Loading agents…"
                      : availableToAssign.length === 0
                        ? "No more agents available"
                        : "Select an estate agent"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableToAssign.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => void handleAssign()}
              disabled={!selectedAgentId || assigning}
            >
              {assigning ? "Assigning…" : "Assign"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

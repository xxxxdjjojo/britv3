import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeChainRiskScore } from "@/services/agent/chain-risk-scoring";
import type { SaleStage } from "@/types/agent";

export const chainRiskMonitor = inngest.createFunction(
  {
    id: "chain-risk-monitor",
    name: "Hourly chain risk score recomputation",
  },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const supabase = createAdminClient();

    // Step 1: Find all active chain groups
    const groups = await step.run("find-active-chain-groups", async () => {
      const { data, error } = await supabase
        .from("chain_links")
        .select("chain_group_id")
        .order("chain_group_id");

      if (error) {
        console.error("[chain-risk-monitor] Failed to query chain groups:", error);
        return [] as string[];
      }

      // Deduplicate
      return [...new Set((data ?? []).map((r) => r.chain_group_id as string))];
    });

    if (groups.length === 0) {
      return { status: "no_chains", scoresUpdated: 0 };
    }

    // Step 2: Batch process groups
    const BATCH_SIZE = 20;
    let totalUpdated = 0;

    for (let i = 0; i < groups.length; i += BATCH_SIZE) {
      const batch = groups.slice(i, i + BATCH_SIZE);

      const batchResult = await step.run(
        `process-batch-${Math.floor(i / BATCH_SIZE)}`,
        async () => {
          // Batch 1: Fetch ALL chain links for ALL groups in this batch at once
          const { data: allLinks, error: linksError } = await supabase
            .from("chain_links")
            .select("chain_group_id, upstream_progression_id, downstream_progression_id, position_in_chain")
            .in("chain_group_id", batch);

          if (linksError) {
            console.error("[chain-risk-monitor] Failed to batch-fetch chain links:", linksError);
            return 0;
          }
          if (!allLinks || allLinks.length === 0) return 0;

          // Group links by chain_group_id
          const linksByGroup = new Map<string, typeof allLinks>();
          for (const link of allLinks) {
            const gid = link.chain_group_id as string;
            if (!linksByGroup.has(gid)) linksByGroup.set(gid, []);
            linksByGroup.get(gid)!.push(link);
          }

          // Collect ALL unique progression IDs across all groups
          const allProgressionIds = new Set<string>();
          for (const link of allLinks) {
            allProgressionIds.add(link.upstream_progression_id as string);
            allProgressionIds.add(link.downstream_progression_id as string);
          }

          // Batch 2: Fetch ALL progressions at once
          const { data: allProgressions, error: progressionsError } = await supabase
            .from("agent_sale_progressions")
            .select("id, stage, updated_at, agent_id, property_id")
            .in("id", Array.from(allProgressionIds));

          if (progressionsError) {
            console.error("[chain-risk-monitor] Failed to batch-fetch progressions:", progressionsError);
            return 0;
          }
          if (!allProgressions || allProgressions.length === 0) return 0;

          // Index progressions by ID for fast lookup
          const progressionById = new Map(
            allProgressions.map((p) => [p.id as string, p]),
          );

          // Build upsert rows for all groups
          const upsertRows: Array<{
            progression_id: string;
            chain_group_id: string;
            risk_level: string;
            risk_score: number;
            chain_length: number;
            chain_position: number;
            slowest_link_id: string | null;
            slowest_link_days: number;
            factors: unknown;
            computed_at: string;
            updated_at: string;
          }> = [];

          const now = new Date().toISOString();

          for (const groupId of batch) {
            const links = linksByGroup.get(groupId);
            if (!links || links.length === 0) continue;

            // Collect progression IDs for this group
            const groupProgressionIds = new Set<string>();
            for (const link of links) {
              groupProgressionIds.add(link.upstream_progression_id as string);
              groupProgressionIds.add(link.downstream_progression_id as string);
            }

            // Build members for scoring from the pre-fetched progressions
            const members: Array<{
              id: string;
              stage: SaleStage;
              days_in_stage: number;
              updated_at: string;
              position: number;
            }> = [];

            for (const pid of Array.from(groupProgressionIds)) {
              const p = progressionById.get(pid);
              if (!p) continue;
              const daysInStage = Math.floor(
                (Date.now() - new Date(p.updated_at as string).getTime()) / (1000 * 60 * 60 * 24),
              );
              let position = 1;
              for (const link of links) {
                if (link.downstream_progression_id === p.id) {
                  position = Math.max(position, (link.position_in_chain as number) + 1);
                }
                if (link.upstream_progression_id === p.id) {
                  position = Math.max(position, link.position_in_chain as number);
                }
              }
              members.push({
                id: p.id as string,
                stage: p.stage as SaleStage,
                days_in_stage: daysInStage,
                updated_at: p.updated_at as string,
                position,
              });
            }

            if (members.length === 0) continue;

            for (const member of members) {
              const result = computeChainRiskScore(members, member.id, member.position);
              upsertRows.push({
                progression_id: member.id,
                chain_group_id: groupId,
                risk_level: result.risk_level,
                risk_score: result.risk_score,
                chain_length: members.length,
                chain_position: member.position,
                slowest_link_id: result.slowest_link_id,
                slowest_link_days: result.slowest_link_days,
                factors: result.factors,
                computed_at: now,
                updated_at: now,
              });
            }
          }

          if (upsertRows.length === 0) return 0;

          // Batch 3: Single upsert for ALL risk scores
          const { error: upsertError } = await supabase
            .from("chain_risk_scores")
            .upsert(upsertRows, { onConflict: "progression_id" });

          if (upsertError) {
            console.error("[chain-risk-monitor] Failed to batch-upsert risk scores:", upsertError);
            return 0;
          }

          return upsertRows.length;
        },
      );

      totalUpdated += batchResult;
    }

    return {
      status: "completed",
      chainGroups: groups.length,
      scoresUpdated: totalUpdated,
    };
  },
);

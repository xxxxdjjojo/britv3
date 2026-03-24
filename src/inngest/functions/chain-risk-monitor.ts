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
          let updated = 0;

          for (const groupId of batch) {
            // Fetch all links in this chain group
            const { data: links } = await supabase
              .from("chain_links")
              .select("upstream_progression_id, downstream_progression_id, position_in_chain")
              .eq("chain_group_id", groupId);

            if (!links || links.length === 0) continue;

            // Collect all unique progression IDs
            const progressionIds = new Set<string>();
            for (const link of links) {
              progressionIds.add(link.upstream_progression_id as string);
              progressionIds.add(link.downstream_progression_id as string);
            }

            // Fetch progressions
            const { data: progressions } = await supabase
              .from("agent_sale_progressions")
              .select("id, stage, updated_at, agent_id, property_id")
              .in("id", [...progressionIds]);

            if (!progressions || progressions.length === 0) continue;

            // Build members for scoring
            const members = progressions.map((p) => {
              const daysInStage = Math.floor(
                (Date.now() - new Date(p.updated_at as string).getTime()) / (1000 * 60 * 60 * 24),
              );
              // Find position from links
              let position = 1;
              for (const link of links) {
                if (link.downstream_progression_id === p.id) {
                  position = Math.max(position, (link.position_in_chain as number) + 1);
                }
                if (link.upstream_progression_id === p.id) {
                  position = Math.max(position, link.position_in_chain as number);
                }
              }
              return {
                id: p.id as string,
                stage: p.stage as SaleStage,
                days_in_stage: daysInStage,
                updated_at: p.updated_at as string,
                position,
              };
            });

            // Compute and upsert risk scores for each member
            for (const member of members) {
              const result = computeChainRiskScore(members, member.id, member.position);

              const { error: upsertError } = await supabase
                .from("chain_risk_scores")
                .upsert(
                  {
                    progression_id: member.id,
                    chain_group_id: groupId,
                    risk_level: result.risk_level,
                    risk_score: result.risk_score,
                    chain_length: members.length,
                    chain_position: member.position,
                    slowest_link_id: result.slowest_link_id,
                    slowest_link_days: result.slowest_link_days,
                    factors: result.factors,
                    computed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "progression_id" },
                );

              if (!upsertError) updated++;
            }
          }

          return updated;
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

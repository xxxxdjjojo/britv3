import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  AWARD_MIN_SAMPLE,
  type AwardMetricStanding,
} from "@/services/awards/award-scoring-service";
import { getAgencyAwardStanding } from "@/services/awards/award-standing-service";

/**
 * Honest Agent Awards standing panel (agent dashboard). Server component:
 * fetches the caller's agency standing and shows either the per-metric score
 * or the honest exclusion explanation ("not enough data yet — you need ≥N
 * matched sales"). Never a fabricated number.
 */

function formatValue(standing: AwardMetricStanding): string {
  if (standing.value === null) return "—";
  switch (standing.metric) {
    case "pricing_accuracy":
      return `${standing.value}% median gap to sold price`;
    case "time_to_sell": {
      const days = Math.abs(standing.value);
      if (standing.value === 0) return "level with the local median";
      return standing.value < 0
        ? `${days} days faster than the local median`
        : `${days} days slower than the local median`;
    }
    case "listing_hygiene":
      return `${standing.value}% of listings stale or withdrawn`;
  }
}

function exclusionCopy(standing: AwardMetricStanding): string {
  if (standing.exclusionReason === "no_baseline") {
    return "No local baseline has cleared its sample threshold yet — nobody is ranked on this metric until it does.";
  }
  const needed = AWARD_MIN_SAMPLE - standing.sampleN;
  const unit =
    standing.metric === "listing_hygiene" ? "listings" : "matched sales";
  return `Not enough data yet — you need at least ${AWARD_MIN_SAMPLE} ${unit} to be ranked (you have ${standing.sampleN}; ${needed} more to go).`;
}

export async function AwardStandingPanel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const result = await getAgencyAwardStanding(supabase, user.id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base font-semibold">
          Honest Agent Awards {result.period}
        </CardTitle>
        {result.organisation && (
          <Badge variant={result.optedIn ? "default" : "secondary"}>
            {result.optedIn ? "Opted in" : "Not opted in"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!result.organisation ? (
          <p className="text-sm text-muted-foreground">
            Award standings are computed per agency. Your account is not
            linked to an agency organisation yet, so there is nothing to
            score — once it is, your per-metric standing appears here.
          </p>
        ) : (
          <>
            {!result.optedIn && (
              <p className="text-sm text-muted-foreground">
                {result.organisation.name} is not opted in yet. Entry is free
                and votes are never an input —{" "}
                <Link
                  href="/awards"
                  className="font-medium text-brand-primary underline underline-offset-2"
                >
                  opt in on the awards page
                </Link>
                .
              </p>
            )}
            <ul className="space-y-3">
              {result.standing?.metrics.map((metric) => (
                <li
                  key={metric.metric}
                  className="rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{metric.label}</p>
                    <Badge variant={metric.eligible ? "default" : "outline"}>
                      {metric.eligible ? "Ranked" : "Excluded"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {metric.eligible ? formatValue(metric) : exclusionCopy(metric)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Scores come from Land Registry completions and your listings only —
          see the{" "}
          <Link
            href="/awards/methodology"
            className="font-medium text-brand-primary underline underline-offset-2"
          >
            full methodology
          </Link>
          . The fall-through metric is dropped for year 1.
        </p>
      </CardContent>
    </Card>
  );
}

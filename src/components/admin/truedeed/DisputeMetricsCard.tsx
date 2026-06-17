/**
 * DisputeMetricsCard — server-rendered "metrics that tell us the playbook is
 * working" panel (Phase 5). Pulls DisputeMetrics from the metrics service
 * and renders the playbook's health thresholds inline so the on-duty admin
 * sees the dial, not just the number.
 */

import type { DisputeMetrics } from "@/services/truedeed/dispute-metrics-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = Readonly<{
  metrics: DisputeMetrics | null;
}>;

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function health(label: string, ok: boolean): string {
  return ok ? `${label} — healthy` : `${label} — needs attention`;
}

export function DisputeMetricsCard({ metrics }: Props) {
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Playbook health</CardTitle>
          <CardDescription>
            Metrics could not be loaded. Try refreshing this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const ratePer100 = metrics.disputesPer100Invoices;
  const ratePer100Healthy = ratePer100 < 8;
  const concession = metrics.concessionRate;
  const concessionHealthy = concession >= 0.1 && concession <= 0.25;
  const chargebacksHealthy = metrics.chargebacks === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playbook health</CardTitle>
        <CardDescription>
          Operating dials from the dispute playbook. Concession band 10–25%,
          disputes/100 healthy under 8, chargebacks should be ≈ 0.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Metric
            label="Disputes per 100 invoices"
            value={ratePer100.toFixed(1)}
            note={health("< 8 healthy", ratePer100Healthy)}
          />
          <Metric
            label="Concession rate"
            value={pct(concession)}
            note={health("10–25%", concessionHealthy)}
          />
          <Metric
            label="Chargebacks"
            value={String(metrics.chargebacks)}
            note={health("≈ 0", chargebacksHealthy)}
          />
          <Metric
            label="Resolved at rebuttal window"
            value={pct(metrics.pctResolvedAtWindow)}
            note="rising % = system working"
          />
          <Metric
            label="Open / Conceded / Rejected"
            value={`${metrics.open} / ${metrics.conceded} / ${metrics.rejected}`}
            note="status breakdown"
          />
          <Metric
            label="Repeat disputers"
            value={String(metrics.repeatDisputers.length)}
            note="agents with ≥ 2 disputes"
          />
        </dl>

        {metrics.repeatDisputers.length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Top repeat disputers
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {metrics.repeatDisputers.slice(0, 5).map((row) => (
                <li
                  key={row.agentId}
                  className="flex justify-between rounded-md bg-muted/50 px-3 py-1"
                >
                  <span className="font-mono text-xs">{row.agentId}</span>
                  <span className="font-medium">{row.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold">{value}</dd>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

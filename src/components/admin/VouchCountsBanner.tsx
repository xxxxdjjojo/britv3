import type { VouchRules } from "@/types/provider-dashboard";

type Props = Readonly<{
  counts: { peer: number; client: number };
  rules: VouchRules;
  gate: { peerMet: boolean; clientMet: boolean; allMet: boolean; gateEnabled: boolean };
}>;

function Stat({
  label,
  value,
  target,
  met,
}: {
  label: string;
  value: number;
  target: number;
  met: boolean;
}) {
  return (
    <div
      aria-label={`${label}: ${value} of ${target} — ${met ? "met" : "not met"}`}
      className={`rounded-lg border p-3 ${met ? "border-green-200 bg-green-50" : "border-border bg-muted"}`}
    >
      <p className="text-xs text-neutral-500">{label}</p>
      <p
        className={`mt-0.5 text-lg font-semibold ${met ? "text-green-700" : "text-neutral-900"}`}
      >
        {value}
        <span className="text-sm font-normal text-neutral-400">/{target}</span>
      </p>
      <p
        className={`mt-0.5 text-xs font-medium ${met ? "text-green-700" : "text-neutral-500"}`}
      >
        {met ? "✓ Met" : "Not met"}
      </p>
    </div>
  );
}

export function VouchCountsBanner({ counts, rules, gate }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat
          label="Peer vouches"
          value={counts.peer}
          target={rules.required_peer_vouches}
          met={gate.peerMet}
        />
        <Stat
          label={`Client vouches (last ${rules.client_recency_days} days)`}
          value={counts.client}
          target={rules.required_client_vouches}
          met={gate.clientMet}
        />
      </div>

      {gate.gateEnabled && !gate.allMet && (
        <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Vouch requirements not met — the gate is enforced.
        </p>
      )}
      {!gate.gateEnabled && (
        <p className="mt-3 text-xs text-neutral-400">
          Gate is off — vouch counts are informational only.
        </p>
      )}
    </div>
  );
}

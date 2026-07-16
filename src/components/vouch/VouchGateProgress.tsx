"use client";

import { useMemo, useState } from "react";
import { Check, Clock3, Copy, Mail, MessageCircle, Smartphone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type VouchRequestStatus = "pending" | "accepted" | "declined" | "expired" | "revoked";

export type VouchRequestSummary = Readonly<{
  id: string;
  voucherKind: "peer" | "client";
  status: VouchRequestStatus;
  requestedAt: string;
  expiresAt: string;
}>;

type Props = Readonly<{
  peerCount: number;
  clientCount: number;
  grandfathered: boolean;
  gateComplete: boolean;
  requests: VouchRequestSummary[];
  origin?: string;
}>;

const STATUS = {
  accepted: { label: "Accepted", className: "border-emerald-200 bg-emerald-50 text-emerald-800", Icon: Check },
  pending: { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-800", Icon: Clock3 },
  expired: { label: "Expired", className: "border-neutral-200 bg-neutral-50 text-neutral-600", Icon: Clock3 },
  revoked: { label: "Cancelled", className: "border-neutral-200 bg-neutral-50 text-neutral-600", Icon: X },
  declined: { label: "Declined", className: "border-neutral-200 bg-neutral-50 text-neutral-600", Icon: X },
} as const;

function latestFirst(a: VouchRequestSummary, b: VouchRequestSummary) {
  return b.requestedAt.localeCompare(a.requestedAt);
}

function slotsFor(kind: "peer" | "client", requests: VouchRequestSummary[]) {
  const relevant = requests
    .filter((request) => request.voucherKind === kind)
    .sort((a, b) => {
      const priority = { accepted: 0, pending: 1, expired: 2, revoked: 3, declined: 4 };
      return priority[a.status] - priority[b.status] || latestFirst(a, b);
    })
    .slice(0, 3);
  return [...relevant, ...Array.from({ length: 3 - relevant.length }, () => null)];
}

function VouchSlot({
  request,
  kind,
  index,
  onInvite,
}: Readonly<{
  request: VouchRequestSummary | null;
  kind: "peer" | "client";
  index: number;
  onInvite: () => void;
}>) {
  if (!request) {
    return (
      <li
        data-testid={`${kind}-slot-${index + 1}`}
        className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white p-3 text-center"
      >
        <span className="text-sm font-semibold text-neutral-700">Invite someone</span>
        <button
          type="button"
          className="mt-2 min-h-11 rounded-lg px-3 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={`Invite a ${kind}`}
          onClick={onInvite}
        >
          Add {kind}
        </button>
      </li>
    );
  }

  const meta = STATUS[request.status];
  return (
    <li
      data-testid={`${kind}-slot-${index + 1}`}
      className={`flex min-h-28 flex-col items-center justify-center rounded-xl border p-3 text-center ${meta.className}`}
    >
      <meta.Icon className="size-5" aria-hidden="true" />
      <span className="mt-2 text-sm font-bold">{meta.label}</span>
      <span className="mt-1 text-xs opacity-75">{kind === "peer" ? "Industry peer" : "Past client"}</span>
    </li>
  );
}

export function VouchGateProgress({
  peerCount,
  clientCount,
  grandfathered,
  gateComplete,
  requests,
  origin = typeof window === "undefined" ? "" : window.location.origin,
}: Props) {
  const [composerKind, setComposerKind] = useState<"peer" | "client" | null>(null);
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const peerSlots = useMemo(() => slotsFor("peer", requests), [requests]);
  const clientSlots = useMemo(() => slotsFor("client", requests), [requests]);
  const genuinelyComplete = peerCount >= 3 && clientCount >= 3;

  async function createInvitation() {
    if (!composerKind || !email) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/vouches/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ voucherKind: composerKind, invitedEmail: email }),
      });
      const body = (await response.json().catch(() => null)) as { inviteToken?: string; error?: string } | null;
      if (!response.ok || !body?.inviteToken) {
        setError(body?.error ?? "We could not create this invitation. Please try again.");
        return;
      }
      setInviteUrl(`${origin}/vouch/${encodeURIComponent(body.inviteToken)}`);
    } catch {
      setError("We could not create this invitation. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const message = `Will you vouch for me on TrueDeed? ${inviteUrl}`;
  const encodedMessage = encodeURIComponent(message);

  return (
    <section aria-labelledby="vouch-gate-heading" className="rounded-2xl border border-border bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-primary">Vouch gate</p>
          <h2 id="vouch-gate-heading" className="mt-1 font-heading text-2xl font-bold tracking-tight text-brand-primary-dark">
            Build your trusted six
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Ask three eligible trade peers and three past clients to confirm your reputation.
          </p>
        </div>
        <div className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-semibold text-neutral-700" role="status">
          {genuinelyComplete
            ? "Trusted six complete"
            : grandfathered && gateComplete
              ? "Access preserved — vouches still optional"
              : `${Math.min(peerCount, 3) + Math.min(clientCount, 3)} of 6 accepted`}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">{peerCount} of 3 peers accepted</h3>
          <ol className="mt-3 grid grid-cols-3 gap-2" aria-label="Peer vouch progress">
            {peerSlots.map((request, index) => (
              <VouchSlot key={request?.id ?? `peer-empty-${index}`} request={request} kind="peer" index={index} onInvite={() => setComposerKind("peer")} />
            ))}
          </ol>
        </div>
        <div>
          <h3 className="text-sm font-bold text-neutral-900">{clientCount} of 3 clients accepted</h3>
          <ol className="mt-3 grid grid-cols-3 gap-2" aria-label="Client vouch progress">
            {clientSlots.map((request, index) => (
              <VouchSlot key={request?.id ?? `client-empty-${index}`} request={request} kind="client" index={index} onInvite={() => setComposerKind("client")} />
            ))}
          </ol>
        </div>
      </div>

      {composerKind && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="composer-title" className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">Private invitation</p>
                <h3 id="composer-title" className="mt-1 text-xl font-bold text-neutral-900">Invite a {composerKind}</h3>
              </div>
              <button type="button" aria-label="Close invitation composer" onClick={() => setComposerKind(null)} className="min-h-11 min-w-11 rounded-lg p-2 hover:bg-neutral-100">
                <X className="size-5" />
              </button>
            </div>

            {!inviteUrl ? (
              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="vouch-email" className="text-sm font-semibold text-neutral-800">Email address</label>
                  <Input id="vouch-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 min-h-11" />
                  <p className="mt-1 text-xs text-neutral-500">Only this verified email can accept the invitation.</p>
                </div>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <Button type="button" disabled={busy || !email} onClick={createInvitation} className="min-h-11 w-full">
                  {busy ? "Creating…" : "Create invitation"}
                </Button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <a className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-bold text-black" href={`https://wa.me/?text=${encodedMessage}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-5" /> Share on WhatsApp
                </a>
                <a className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-semibold" href={`sms:?&body=${encodedMessage}`}>
                  <Smartphone className="size-5" /> Send by SMS
                </a>
                <a className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-semibold" href={`mailto:?subject=${encodeURIComponent("TrueDeed vouch invitation")}&body=${encodedMessage}`}>
                  <Mail className="size-5" /> Send by email
                </a>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-semibold"
                  onClick={async () => {
                    await navigator.clipboard.writeText(inviteUrl);
                    setCopied(true);
                  }}
                >
                  <Copy className="size-5" /> {copied ? "Link copied" : "Copy invitation link"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminTicketDetail } from "@/services/admin/support-admin-service";

/**
 * Admin ticket detail actions (PR 7): view the thread (incl. internal notes),
 * post a public reply or internal note, and resolve. All writes go through the
 * audited PATCH /api/admin/support/[id]; a public reply emails the customer.
 */
export function SupportTicketAdminClient({ ticket }: Readonly<{ ticket: AdminTicketDetail }>) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(payload: unknown): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleReply(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!body.trim()) return;
    await patch({ reply: { body: body.trim(), internal } });
    setBody("");
    setInternal(false);
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {ticket.messages.map((message) => (
          <li
            key={message.id}
            className={`rounded-xl border p-4 ${
              message.internalNote
                ? "border-amber-200 bg-amber-50"
                : message.authorType === "admin"
                  ? "border-brand-primary/20 bg-brand-primary/5"
                  : "border-neutral-200 bg-white"
            }`}
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {message.authorType}
              {message.internalNote ? " · internal note" : ""}
            </p>
            <p className="whitespace-pre-wrap text-sm text-neutral-800">{message.body}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={handleReply} className="rounded-xl border border-neutral-200 bg-white p-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">Reply</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Write a reply to the customer…"
          />
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
          Internal note (not sent to the customer)
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Send
          </button>
          {ticket.status !== "resolved" && ticket.status !== "closed" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => patch({ status: "resolved" })}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Mark resolved
            </button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

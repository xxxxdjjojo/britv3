"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  type IncidentSeverity,
  type IncidentStatus,
  type StatusIncident,
} from "@/services/admin/status-incident-service";

/**
 * Admin control surface for status incidents (PR 3). Create draft incidents,
 * publish/unpublish them, transition status, and post a public update. All
 * writes go through the audited /api/admin/status-incidents routes; on success
 * we refresh the server component so the list reflects the new state.
 */

type Props = Readonly<{ incidents: readonly StatusIncident[] }>;

export function StatusIncidentsClient({ incidents }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("minor");
  const [status, setStatus] = useState<IncidentStatus>("investigating");
  const [publishNow, setPublishNow] = useState(false);

  async function send(url: string, method: string, body: unknown): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  async function handleCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!title.trim()) return;
    await send("/api/admin/status-incidents", "POST", {
      title: title.trim(),
      severity,
      status,
      isPublished: publishNow,
    });
    setTitle("");
    setPublishNow(false);
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-neutral-200 bg-white p-5"
        aria-label="Create incident"
      >
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">New incident</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-neutral-700">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
              placeholder="e.g. Sign-in is failing for some users"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-neutral-700">Severity</span>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
              >
                {INCIDENT_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-neutral-700">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IncidentStatus)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
              >
                {INCIDENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
          />
          Publish to the public status page immediately
        </label>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Create incident
        </button>
      </form>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {incidents.length > 0 ? (
        <ul className="space-y-3">
          {incidents.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} busy={busy} onSend={send} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function IncidentRow({
  incident,
  busy,
  onSend,
}: Readonly<{
  incident: StatusIncident;
  busy: boolean;
  onSend: (url: string, method: string, body: unknown) => Promise<void>;
}>) {
  const url = `/api/admin/status-incidents/${incident.id}`;
  return (
    <li className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-neutral-900">{incident.title}</p>
          <p className="text-xs text-neutral-500">
            {incident.severity} · {incident.status} ·{" "}
            {incident.isPublished ? "published" : "draft"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onSend(url, "PATCH", { isPublished: !incident.isPublished })}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {incident.isPublished ? "Unpublish" : "Publish"}
          </button>
          {incident.status !== "resolved" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onSend(url, "PATCH", {
                  status: "resolved",
                  updateBody: "This incident has been resolved.",
                })
              }
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              Mark resolved
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

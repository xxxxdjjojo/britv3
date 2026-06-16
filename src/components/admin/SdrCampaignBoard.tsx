// src/components/admin/SdrCampaignBoard.tsx
"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { SdrJob } from "@/services/acquisition/sdr-campaign-service";

interface Props {
  readonly initialJobs: ReadonlyArray<SdrJob>;
}

interface EnqueueForm {
  targetId: string;
  contact: string;
  audience: "trade" | "agent" | "developer";
  postcode: string;
}

const EMPTY: EnqueueForm = {
  targetId: "",
  contact: "",
  audience: "trade",
  postcode: "",
};

export function SdrCampaignBoard({ initialJobs }: Props) {
  const [form, setForm] = useState<EnqueueForm>(EMPTY);
  const [jobs, setJobs] = useState<ReadonlyArray<SdrJob>>(initialJobs);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refresh(): Promise<void> {
    const res = await fetch("/api/admin/sdr");
    if (!res.ok) return;
    const data = (await res.json()) as { jobs?: SdrJob[] };
    if (data.jobs) setJobs(data.jobs);
  }

  async function submit(): Promise<void> {
    setError(null);
    const res = await fetch("/api/admin/sdr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError(`Enqueue failed (${res.status})`);
      return;
    }
    setForm(EMPTY);
    await refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-neutral-200 p-6">
        <h2 className="font-heading text-lg font-bold text-neutral-900">
          Enqueue an outbound target
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="block text-neutral-700">Target ID</span>
            <input
              value={form.targetId}
              onChange={(e) => setForm({ ...form, targetId: e.target.value })}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block text-neutral-700">Contact (email)</span>
            <input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block text-neutral-700">Audience</span>
            <select
              value={form.audience}
              onChange={(e) =>
                setForm({ ...form, audience: e.target.value as EnqueueForm["audience"] })
              }
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            >
              <option value="trade">Trade</option>
              <option value="agent">Agent</option>
              <option value="developer">Developer</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-neutral-700">Postcode</span>
            <input
              value={form.postcode}
              onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>
        )}
        <div className="mt-4">
          <Button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => { void submit(); })}
            className="bg-brand-primary hover:bg-brand-primary-light"
          >
            {pending ? "Enqueuing…" : "Enqueue"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 p-6">
        <h2 className="font-heading text-lg font-bold text-neutral-900">
          Recent jobs
        </h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-600">
              <th className="py-2 pr-4">Job ID</th>
              <th className="py-2 pr-4">Audience</th>
              <th className="py-2 pr-4">Contact</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-neutral-500">
                  No jobs yet — enqueue one above.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.jobId} className="border-b border-neutral-100">
                  <td className="py-2 pr-4 font-mono text-xs">{job.jobId}</td>
                  <td className="py-2 pr-4">{job.target.audience}</td>
                  <td className="py-2 pr-4">{job.target.contact}</td>
                  <td className="py-2 capitalize">{job.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

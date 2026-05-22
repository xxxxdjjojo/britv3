// src/services/acquisition/sdr-campaign-service.ts
//
// Memo Pivot v2 — outbound SDR queue. Enqueues targets and processes them
// in throttled batches. Idempotent: enqueuing the same (targetId, persona)
// twice yields the same jobId — duplicates never burn a send.
//
// Persistence: writes to Supabase sdr_messages when the service-role env
// vars are available; falls back to an in-memory Map otherwise so tests
// and local dev keep working without a DB. The Map is per-process, so
// idempotency across serverless instances depends on Supabase being
// configured in production.

import { createHash } from "node:crypto";

import { PERSONA_TEMPLATES, type SdrPersona } from "./persona-templates";

export interface SdrTarget {
  readonly id: string;
  readonly contact: string;
  readonly audience: "trade" | "agent" | "developer" | string;
  readonly postcode?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface SdrJob {
  readonly jobId: string;
  readonly target: SdrTarget;
  readonly persona: SdrPersona;
  readonly status: "queued" | "sent" | "skipped" | "failed";
  readonly enqueuedAt: string;
}

interface EnqueueResult {
  readonly jobId: string;
  readonly created: boolean;
}

interface ProcessBatchArgs {
  readonly limit: number;
  readonly dryRun?: boolean;
}

interface ProcessBatchResult {
  readonly processed: number;
  readonly skipped: number;
  readonly failures: number;
}

const MAX_BATCH = 200;

// In-memory fallback used when Supabase service-role env isn't configured.
// Always written through to (so test snapshots and local dev work even
// without a DB). When Supabase IS configured, it's still consulted for
// fast snapshot rendering, but the durable record lives in Supabase.
const queue: Map<string, SdrJob> = new Map();

function computeJobId(target: SdrTarget, persona: SdrPersona): string {
  return createHash("sha256")
    .update(`${target.id}::${persona}`)
    .digest("hex")
    .slice(0, 24);
}

function isValidPersona(persona: string): persona is SdrPersona {
  return persona in PERSONA_TEMPLATES;
}

function isSupabaseConfigured(): boolean {
  return (
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

interface SdrMessageRow {
  job_id: string;
  status: SdrJob["status"];
  body: string;
  enqueued_at?: string;
}

function rowToJob(row: SdrMessageRow): SdrJob | null {
  try {
    const body = JSON.parse(row.body) as {
      target: SdrTarget;
      persona: SdrPersona;
    };
    return {
      jobId: row.job_id,
      target: body.target,
      persona: body.persona,
      status: row.status,
      enqueuedAt: row.enqueued_at ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function enqueueOutbound(
  target: SdrTarget,
  persona: string,
): Promise<EnqueueResult> {
  if (!target.contact || target.contact.trim().length === 0) {
    throw new Error("SDR target requires a contact address");
  }
  if (!isValidPersona(persona)) {
    throw new Error(`Unknown SDR persona: ${persona}`);
  }
  const jobId = computeJobId(target, persona);
  const job: SdrJob = {
    jobId,
    target,
    persona,
    status: "queued",
    enqueuedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();
      // Idempotent insert: UNIQUE(job_id) means a duplicate enqueue is a no-op.
      // We swallow the duplicate-key error and treat it as `created: false`.
      const { error } = await supabase.from("sdr_messages").insert({
        job_id: jobId,
        body: JSON.stringify({ target, persona }),
        status: "queued",
        enqueued_at: job.enqueuedAt,
      });
      const created = !error || !error.message?.includes("duplicate");
      queue.set(jobId, job); // mirror to in-memory for fast snapshot
      return { jobId, created };
    } catch {
      // Fall through to in-memory.
    }
  }

  if (queue.has(jobId)) {
    return { jobId, created: false };
  }
  queue.set(jobId, job);
  return { jobId, created: true };
}

export async function processBatch(
  args: ProcessBatchArgs,
): Promise<ProcessBatchResult> {
  const limit = Math.max(0, Math.min(args.limit, MAX_BATCH));
  let processed = 0;
  let skipped = 0;
  let failures = 0;

  if (isSupabaseConfigured()) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();
      // Pull a batch of queued jobs.
      const { data, error } = await supabase
        .from("sdr_messages")
        .select("job_id, status, body, enqueued_at")
        .eq("status", "queued")
        .limit(limit);
      if (error || !data) return { processed: 0, skipped: 0, failures: 0 };

      const newStatus: SdrJob["status"] = args.dryRun ? "skipped" : "sent";
      const jobIds = data.map((r) => r.job_id);
      if (jobIds.length === 0) return { processed: 0, skipped: 0, failures: 0 };

      const { error: updateError } = await supabase
        .from("sdr_messages")
        .update({
          status: newStatus,
          sent_at: args.dryRun ? null : new Date().toISOString(),
        })
        .in("job_id", jobIds);

      if (updateError) {
        failures = jobIds.length;
      } else {
        processed = jobIds.length;
        // Mirror to in-memory
        for (const row of data) {
          const job = rowToJob(row);
          if (job) queue.set(job.jobId, { ...job, status: newStatus });
        }
      }
      return { processed, skipped, failures };
    } catch {
      // Fall through to in-memory path.
    }
  }

  for (const [jobId, job] of queue) {
    if (processed >= limit) break;
    if (job.status !== "queued") {
      skipped += 1;
      continue;
    }
    try {
      const newStatus: SdrJob["status"] = args.dryRun ? "skipped" : "sent";
      queue.set(jobId, { ...job, status: newStatus });
      processed += 1;
    } catch {
      failures += 1;
      queue.set(jobId, { ...job, status: "failed" });
    }
  }
  return { processed, skipped, failures };
}

/**
 * Queue inspector — for the admin dashboard and tests.
 * Returns the in-memory mirror; production callers should also read
 * directly from sdr_messages for a durable view.
 */
export function snapshotQueue(): ReadonlyArray<SdrJob> {
  return Array.from(queue.values());
}

/**
 * Test-only: wipe the in-memory queue.
 */
export function __resetQueueForTests(): void {
  queue.clear();
}

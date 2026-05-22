// src/services/acquisition/sdr-campaign-service.ts
//
// Memo Pivot v2 — outbound SDR queue. Enqueues targets and processes them
// in throttled batches. Idempotent: enqueuing the same (targetId, persona)
// twice yields the same jobId — duplicates never burn a send.
//
// This is a scaffold. Persistence is in-memory in dev; production wires
// the same interface to Supabase (sdr_campaigns / sdr_targets / sdr_messages
// migrations included separately).

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
  if (queue.has(jobId)) {
    return { jobId, created: false };
  }
  queue.set(jobId, {
    jobId,
    target,
    persona,
    status: "queued",
    enqueuedAt: new Date().toISOString(),
  });
  return { jobId, created: true };
}

export async function processBatch(
  args: ProcessBatchArgs,
): Promise<ProcessBatchResult> {
  const limit = Math.max(0, Math.min(args.limit, MAX_BATCH));
  let processed = 0;
  let skipped = 0;
  let failures = 0;
  for (const [jobId, job] of queue) {
    if (processed >= limit) break;
    if (job.status !== "queued") {
      skipped += 1;
      continue;
    }
    try {
      // Real impl would call the Anthropic SDK + email/sms provider here.
      // In dry-run / test mode we just mark sent without side-effects.
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

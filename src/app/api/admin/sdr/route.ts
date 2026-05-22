// src/app/api/admin/sdr/route.ts
//
// Memo Pivot v2 — admin SDR endpoint. POST to enqueue an outbound target;
// GET to inspect the queue. Requires admin role.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  enqueueOutbound,
  snapshotQueue,
  type SdrTarget,
} from "@/services/acquisition/sdr-campaign-service";

const EnqueueSchema = z.object({
  targetId: z.string().min(1),
  contact: z.string().min(3).max(254),
  audience: z.enum(["trade", "agent", "developer"]),
  postcode: z.string().max(12).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    return data?.is_admin === true;
  } catch {
    return false;
  }
}

export async function GET(): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const queue = snapshotQueue();
  const total = queue.length;
  const queued = queue.filter((j) => j.status === "queued").length;
  const sent = queue.filter((j) => j.status === "sent").length;
  return NextResponse.json({ total, queued, sent, jobs: queue.slice(0, 50) });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = EnqueueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const target: SdrTarget = {
    id: parsed.data.targetId,
    contact: parsed.data.contact,
    audience: parsed.data.audience,
    postcode: parsed.data.postcode,
    meta: parsed.data.meta,
  };
  const result = await enqueueOutbound(target, parsed.data.audience);
  return NextResponse.json(result, { status: 200 });
}

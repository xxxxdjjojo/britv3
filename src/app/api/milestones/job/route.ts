/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * API routes for service job milestones.
 * GET  ?id={bookingId} -- list milestones with progress
 * POST body: { booking_id } -- initialize milestones for new booking
 * PATCH ?id={milestoneId} body: { status, notes? } -- update milestone
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getJobMilestones,
  getJobProgress,
  initializeJobMilestones,
  updateJobMilestone,
  updateMilestoneSchema,
} from "@/services/milestones/milestone-service";
import { SERVICE_JOB_MILESTONE_TEMPLATE } from "@/types/milestones";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 },
      );
    }

    const milestones = await getJobMilestones(supabase, bookingId);
    const progress = await getJobProgress(supabase, bookingId);

    // Merge template labels/descriptions into milestone data
    const templateMap = new Map(
      SERVICE_JOB_MILESTONE_TEMPLATE.map((t) => [t.key, t]),
    );

    const enriched = milestones.map((m) => {
      const template = templateMap.get(m.milestone_key);
      return {
        ...m,
        label: template?.label ?? m.milestone_key,
        description: template?.description ?? "",
        order: template?.order ?? 0,
      };
    });

    return NextResponse.json({ milestones: enriched, progress });
  } catch (err) {
    console.error("[api/milestones/job] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const bookingId = body?.booking_id;

    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        { error: "Missing required field: booking_id" },
        { status: 400 },
      );
    }

    const milestones = await initializeJobMilestones(supabase, bookingId);

    return NextResponse.json({ milestones }, { status: 201 });
  } catch (err) {
    console.error("[api/milestones/job] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get("id");

    if (!milestoneId) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = updateMilestoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const milestone = await updateJobMilestone(
      supabase,
      milestoneId,
      user.id,
      parsed.data,
    );

    return NextResponse.json({ milestone });
  } catch (err) {
    console.error("[api/milestones/job] PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getUserOrganisation } from "@/services/organisations/organisation-service";
import { currentAwardPeriod } from "@/services/awards/award-standing-service";

/**
 * Honest Agent Awards nominations (opt-in / withdraw).
 *
 * POST   — opt the caller's agency in for the current award year.
 * DELETE — withdraw the caller's agency for the current award year.
 *
 * Auth mirrors the other agent-role APIs (src/app/api/agent/*): the server
 * Supabase client resolves the user, and the role gate is organisation
 * membership — only an active member of an estate-agency organisation can
 * opt it in. RLS on agent_award_nominations enforces the same server-side
 * (insert requires user_id = auth.uid() AND is_org_member(agency_id)).
 *
 * Entering is free, always. There is no payment path here and none may ever
 * be added; opting in has zero effect on scores.
 */

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const organisation = await getUserOrganisation(supabase, user.id);
    if (!organisation) {
      return NextResponse.json(
        { error: "Only members of an estate agency organisation can opt in" },
        { status: 403 },
      );
    }

    const period = currentAwardPeriod();

    // Upsert: handles first opt-in, re-opt-in after withdrawal, and concurrent
    // requests from the same agency atomically (no UNIQUE constraint violation).
    const { error: upsertError } = await supabase
      .from("agent_award_nominations")
      .upsert(
        {
          agency_id: organisation.organisation_id,
          user_id: user.id,
          period,
          withdrawn_at: null,
        },
        { onConflict: "agency_id,period" },
      );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return NextResponse.json({ optedIn: true, period }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to opt in" }, { status: 500 });
  }
}

export async function DELETE() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const organisation = await getUserOrganisation(supabase, user.id);
    if (!organisation) {
      return NextResponse.json(
        { error: "Only members of an estate agency organisation can withdraw" },
        { status: 403 },
      );
    }

    const period = currentAwardPeriod();

    const { error: updateError } = await supabase
      .from("agent_award_nominations")
      .update({ withdrawn_at: new Date().toISOString() })
      .eq("agency_id", organisation.organisation_id)
      .eq("period", period)
      .is("withdrawn_at", null);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ optedIn: false, period });
  } catch {
    return NextResponse.json({ error: "Failed to withdraw" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAgentLead } from "@/services/valuation/agent-lead-service";
import { captureException } from "@/lib/observability/capture-exception";

const AGENT_NOTICE_VERSION = "vmp-agent-share-2026-06-18"; // TODO(legal): counsel review

const schema = z.object({
  contactPreference: z.enum(["email", "phone"]),
  phone: z.string().min(7).max(20).optional().nullable(),
  sellingTimeline: z.string().max(50).optional().nullable(),
  agentId: z.string().uuid().optional().nullable(),
  agencyId: z.string().uuid().optional().nullable(),
  // Must be an explicit, affirmative true — never assumed from verification.
  consent: z.literal(true),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please confirm your contact preference and agree to share your details." },
      { status: 400 },
    );
  }
  if (parsed.data.contactPreference === "phone" && !parsed.data.phone) {
    return NextResponse.json({ error: "A phone number is required for phone contact." }, { status: 400 });
  }

  const outcome = await createAgentLead(user.id, id, {
    contactEmail: user.email ?? "",
    contactPhone: parsed.data.phone ?? null,
    contactPreference: parsed.data.contactPreference,
    sellingTimeline: parsed.data.sellingTimeline ?? null,
    agentId: parsed.data.agentId ?? null,
    agencyId: parsed.data.agencyId ?? null,
    noticeVersion: AGENT_NOTICE_VERSION,
    sourceRoute: `/value-my-property/result/${id}/expert`,
  });

  if ("error" in outcome) {
    if (outcome.error === "failed") {
      captureException(new Error("agent lead insert failed"), {
        module: "valuation",
        feature: "agent-lead",
        route: "/api/valuations/[id]/agent-lead",
        operation: "createAgentLead",
      });
    }
    const status = outcome.error === "not_found" ? 404 : 500;
    return NextResponse.json({ error: "Could not submit your request." }, { status });
  }
  return NextResponse.json({ ok: true, sharedFields: outcome.sharedFields });
}

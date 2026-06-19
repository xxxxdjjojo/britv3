/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/api/require-agent";
import { createAdminClient } from "@/lib/supabase/admin";
// Barrel import registers all connectors as a side-effect.
import { getConnector } from "@/services/connectors";
import type { ConnectorContext, SourceConnector } from "@/services/connectors/source-connector";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireAgent();
  if (auth.response) {
    return auth.response;
  }

  const { id: integrationId } = await params;

  // Optional payload for csv / generic_feed test probes.
  let payload: string | undefined;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.payload === "string") {
      payload = body.payload;
    }
  } catch {
    // No body — fine for reapit/sandbox.
  }

  try {
    const admin = createAdminClient();

    // Load the integration to discover the provider.
    const { data, error } = await admin
      .from("agent_feed_integrations")
      .select("provider, field_mapping, organisation_id")
      .eq("id", integrationId)
      .eq("agent_id", auth.user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    const row = data as Record<string, unknown>;
    const provider = String(row.provider ?? "");

    let connector: SourceConnector;
    try {
      connector = getConnector(provider);
    } catch {
      return NextResponse.json(
        { error: `No connector registered for provider "${provider}"` },
        { status: 422 },
      );
    }

    const ctx: ConnectorContext = {
      integrationId,
      organisationId:
        row.organisation_id != null ? String(row.organisation_id) : auth.user.id,
      credential: undefined,
      fieldMapping:
        row.field_mapping != null
          ? (row.field_mapping as Record<string, string>)
          : undefined,
      payload,
    };

    const result = await connector.testConnection(ctx);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to test feed connection:", error);
    return NextResponse.json(
      { error: "Failed to test feed connection" },
      { status: 500 },
    );
  }
}

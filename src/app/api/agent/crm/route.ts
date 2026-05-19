/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCrmClients,
  createCrmClient,
  updateCrmClient,
} from "@/services/agent/agent-crm-service";
import type { ClientType } from "@/types/agent";

/**
 * GET /api/agent/crm
 * List CRM clients with optional ?search and ?client_type filters.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? undefined;
    const client_type = searchParams.get("client_type") as ClientType | null;
    const page = searchParams.get("page")
      ? Number(searchParams.get("page"))
      : undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined;

    const clients = await getCrmClients(supabase, user.id, {
      search,
      client_type: client_type ?? undefined,
      page,
      limit,
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Failed to fetch CRM clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch CRM clients" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/crm
 * Create a new CRM client.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const client = await createCrmClient(supabase, user.id, body);
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Failed to create CRM client:", error);
    return NextResponse.json(
      { error: "Failed to create CRM client" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agent/crm
 * Update a CRM client. Requires id in request body.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const client = await updateCrmClient(supabase, id, user.id, updates);
    return NextResponse.json(client);
  } catch (error) {
    console.error("Failed to update CRM client:", error);
    return NextResponse.json(
      { error: "Failed to update CRM client" },
      { status: 500 },
    );
  }
}

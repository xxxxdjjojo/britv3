import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCrmClientSchema } from "@/types/agent";
import type { ClientType } from "@/types/agent";
import {
  getCrmClients,
  createCrmClient,
  updateCrmClient,
  deleteCrmClient,
} from "@/services/agent/agent-crm-service";

/**
 * GET /api/agent/crm
 * Returns a paginated list of CRM clients for the authenticated agent.
 * Accepts ?search, ?client_type (comma-separated), ?offset, ?limit.
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const clientTypeParam = searchParams.get("client_type");
  const clientTypes = clientTypeParam
    ? (clientTypeParam.split(",") as ClientType[])
    : undefined;
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Number(searchParams.get("limit") ?? "25");

  try {
    const page = await getCrmClients(supabase, user.id, {
      search,
      clientTypes,
      offset,
      limit,
    });
    return NextResponse.json(page);
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
 * Creates a new CRM client for the authenticated agent.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = createCrmClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = await createCrmClient(supabase, user.id, parsed.data);
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
 * Updates an existing CRM client. Requires { id, ...fields } in the body.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { id, ...fields } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Client id is required" },
        { status: 400 },
      );
    }

    const updated = await updateCrmClient(supabase, id, user.id, fields);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update CRM client:", error);
    return NextResponse.json(
      { error: "Failed to update CRM client" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agent/crm
 * Deletes a CRM client. Requires ?id query param.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Client id is required" },
      { status: 400 },
    );
  }

  try {
    await deleteCrmClient(supabase, id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete CRM client:", error);
    return NextResponse.json(
      { error: "Failed to delete CRM client" },
      { status: 500 },
    );
  }
}

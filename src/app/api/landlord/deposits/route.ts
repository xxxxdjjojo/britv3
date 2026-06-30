/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listDeposits,
  createDepositRegistration,
} from "@/services/landlord/deposit-service";

/**
 * GET /api/landlord/deposits
 * Returns all deposit registrations for the authenticated landlord.
 * Defense-in-depth: verifies auth with getUser() before querying.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deposits = await listDeposits(supabase);
    return NextResponse.json(deposits);
  } catch (error) {
    console.error("Failed to fetch deposits:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposits" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/landlord/deposits
 * Creates a new deposit registration.
 * Defense-in-depth: verifies auth with getUser() before any DB operation.
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
    const body = await request.json() as Record<string, unknown>;
    const deposit = await createDepositRegistration(supabase, {
      tenancy_id: String(body.tenancy_id ?? ""),
      amount: Number(body.amount ?? 0),
      scheme: body.scheme as "TDS" | "DPS" | "mydeposits" | "other",
      scheme_reference: body.scheme_reference ? String(body.scheme_reference) : null,
      registration_date: body.registration_date ? String(body.registration_date) : null,
      prescribed_info_sent_date: body.prescribed_info_sent_date
        ? String(body.prescribed_info_sent_date)
        : null,
      status: (body.status as "pending" | "registered" | "returned" | "disputed") ?? "pending",
      notes: body.notes ? String(body.notes) : null,
    });
    return NextResponse.json(deposit, { status: 201 });
  } catch (error) {
    console.error("Failed to create deposit registration:", error);
    return NextResponse.json(
      { error: "Failed to create deposit registration" },
      { status: 500 },
    );
  }
}

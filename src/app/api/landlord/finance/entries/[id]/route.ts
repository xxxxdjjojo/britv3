import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { financialEntrySchema } from "@/types/landlord";

/**
 * PATCH /api/landlord/finance/entries/[id]
 * Update a financial entry. Only the owning landlord can edit.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate with Zod (partial — allow any subset of fields)
    const parsed = financialEntrySchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation error" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount;
    if (parsed.data.entry_date !== undefined) updateData.entry_date = parsed.data.entry_date;
    if (parsed.data.description !== undefined) {
      updateData.description = parsed.data.description || null;
    }
    if (parsed.data.rent_period_start !== undefined) {
      updateData.rent_period_start = parsed.data.rent_period_start || null;
    }
    if (parsed.data.rent_period_end !== undefined) {
      updateData.rent_period_end = parsed.data.rent_period_end || null;
    }

    const { data: record, error } = await supabase
      .from("financial_entries")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id) // RLS-level ownership check
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!record) {
      return NextResponse.json(
        { error: "Entry not found or not authorised" },
        { status: 404 },
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/landlord/finance/entries/[id]
 * Delete a financial entry. Only the owning landlord can delete.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("financial_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // ownership check

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

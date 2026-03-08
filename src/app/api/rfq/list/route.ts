import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listUserRfqs,
  listProviderMatchedRfqs,
} from "@/services/marketplace/rfq-service";
import type { RfqStatus } from "@/types/marketplace";

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
    const role = searchParams.get("role") ?? "user";
    const status = searchParams.get("status") as RfqStatus | null;
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

    if (role === "provider") {
      const result = await listProviderMatchedRfqs(
        supabase,
        user.id,
        limit,
        offset,
      );
      return NextResponse.json({ data: result.data, count: result.count });
    }

    const result = await listUserRfqs(
      supabase,
      user.id,
      status ?? undefined,
      limit,
      offset,
    );
    return NextResponse.json({ data: result.data, count: result.count });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list RFQs";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPortfolio } from "@/services/landlord/portfolio-service";

export async function GET() {
  try {
    const supabase = await createClient();
    const portfolio = await getPortfolio(supabase);

    return NextResponse.json({ data: portfolio });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch portfolio";
    const status = message === "Authentication required" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

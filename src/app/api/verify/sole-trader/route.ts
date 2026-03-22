import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateUTR, normalizeUTR, validateHmrcAmlReference } from "@/lib/validators/uk";

export async function POST(request: NextRequest) {
  try {
    const { utr_number, trading_name, trading_address, vat_number, hmrc_aml_reference } =
      await request.json();

    if (!utr_number || !validateUTR(utr_number)) {
      return NextResponse.json(
        { error: "UTR must be exactly 10 digits." },
        { status: 400 },
      );
    }

    if (!trading_name || typeof trading_name !== "string" || trading_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Trading name is required." },
        { status: 400 },
      );
    }

    if (hmrc_aml_reference && !validateHmrcAmlReference(hmrc_aml_reference)) {
      return NextResponse.json(
        { error: "Invalid HMRC AML reference format." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { error: dbError } = await supabase.from("business_verifications").upsert(
      {
        user_id: user.id,
        utr_number: normalizeUTR(utr_number),
        trading_name: trading_name.trim(),
        trading_address: trading_address || null,
        vat_number: vat_number || null,
        hmrc_aml_reference: hmrc_aml_reference || null,
      },
      { onConflict: "user_id" },
    );

    if (dbError) {
      console.error("[Sole Trader] DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to save verification data." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, utr_masked: "******" + normalizeUTR(utr_number).slice(-4) });
  } catch (err) {
    console.error("[Sole Trader] Unexpected error:", err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}

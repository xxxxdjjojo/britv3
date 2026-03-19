import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check existing factors
  const { data: factors, error: listError } =
    await supabase.auth.mfa.listFactors();

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const totpFactors = factors?.totp ?? [];

  // If a verified TOTP factor exists, MFA is already enabled
  const verifiedFactor = totpFactors.find((f) => f.status === "verified");
  if (verifiedFactor) {
    return NextResponse.json(
      { error: "MFA already enabled" },
      { status: 409 },
    );
  }

  // Unenroll any unverified stale TOTP factor before starting fresh
  const unverifiedFactor = totpFactors.find((f) => (f.status as string) === "unverified");
  if (unverifiedFactor) {
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: unverifiedFactor.id,
    });
    if (unenrollError) {
      return NextResponse.json(
        { error: unenrollError.message },
        { status: 500 },
      );
    }
  }

  // Enroll new TOTP factor
  const { data: enrollment, error: enrollError } =
    await supabase.auth.mfa.enroll({ factorType: "totp" });

  if (enrollError || !enrollment) {
    return NextResponse.json(
      { error: enrollError?.message ?? "Enrollment failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: enrollment.id,
    totp: {
      qr_code: enrollment.totp.qr_code,
      secret: enrollment.totp.secret,
      uri: enrollment.totp.uri,
    },
  });
}

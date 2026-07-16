/**
 * POST /api/provider/certificates
 *
 * Issues a new certificate for a provider.
 * Auth-guarded: requires an authenticated session with a valid provider profile.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";
import { resolveProviderId } from "@/lib/provider/resolve-provider";
import { issueCertificate } from "@/services/provider/provider-certificate-service";
import type { CertificateType, CertificateInput } from "@/services/provider/provider-certificate-service";

export async function POST(request: Request) {
  const providerAccess = await requireProviderAccess("progress");
  if (providerAccess.response) return providerAccess.response;
  const supabase = await createClient();

  // Auth check
  let providerId: string;
  try {
    const identity = await resolveProviderId(supabase);
    providerId = identity.providerId;
  } catch {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  const input: CertificateInput = {
    bookingId: typeof raw["bookingId"] === "string" ? raw["bookingId"] : undefined,
    certificateType: raw["certificateType"] as CertificateType,
    certificateNumber:
      typeof raw["certificateNumber"] === "string" ? raw["certificateNumber"] : undefined,
    data:
      raw["data"] !== null && typeof raw["data"] === "object"
        ? (raw["data"] as Record<string, unknown>)
        : undefined,
    issuedAt: typeof raw["issuedAt"] === "string" ? raw["issuedAt"] : undefined,
    expiresAt: typeof raw["expiresAt"] === "string" ? raw["expiresAt"] : undefined,
    notes: typeof raw["notes"] === "string" ? raw["notes"] : undefined,
  };

  // Validate required field
  if (!input.certificateType) {
    return NextResponse.json({ error: "certificateType is required" }, { status: 400 });
  }

  try {
    const certificate = await issueCertificate(supabase, providerId, input);
    return NextResponse.json(certificate, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to issue certificate";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

/**
 * /reference/[token] — public, UNAUTHENTICATED referee vouch surface.
 *
 * The referee lands here from the email link (T7). The single-use raw token in
 * the URL IS the authorization: there is no session. The server component reads
 * the invitation directly with the service-role client (which bypasses RLS —
 * the token is the bearer credential) and branches on the resolved state. It
 * exposes ONLY the provider's display name + trade and the referee's own name —
 * never provider_id, referee_email, or any internal id.
 *
 * There is deliberately no GET API route: the server component is the read
 * surface (mirrors /pay/[token]). Token entropy (256-bit) + generic states are
 * the enumeration guard; the submit/decline mutation routes carry rate limits.
 */

import type { Metadata } from "next";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveInvitationByToken } from "@/services/provider/reference-submission-service";
import { ReferenceSubmissionForm } from "@/components/reference/ReferenceSubmissionForm";
import { ReferenceTokenState } from "@/components/reference/ReferenceTokenState";

export const dynamic = "force-dynamic";

// Private link — never index. Generic title leaks nothing about the invite.
export const metadata: Metadata = {
  title: "Confirm a reference",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ token: string }> };

export default async function ReferencePage({ params }: PageProps) {
  const { token } = await params;

  const admin = createAdminClient();
  const result = await resolveInvitationByToken(admin, token);

  if (result.state === "valid" && result.reference && result.provider) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-14">
        <ReferenceSubmissionForm
          token={token}
          providerName={result.provider.displayName}
          providerTrade={result.provider.trade}
          referenceType={result.reference.reference_type}
          refereeName={result.reference.referee_name}
          relationship={result.reference.relationship}
          requiresWorkDate={result.reference.requires_work_date}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-10">
      <ReferenceTokenState
        variant={result.state}
        providerName={result.provider?.displayName}
      />
    </main>
  );
}

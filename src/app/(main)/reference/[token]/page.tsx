import type { Metadata } from "next";
import { verifyReferenceToken } from "@/lib/auth/reference-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { RefereeSubmissionForm } from "@/components/providers/RefereeSubmissionForm";

export const metadata: Metadata = {
  title: "Submit Reference | Britestate",
  robots: { index: false, follow: false },
};

type PageProps = Readonly<{
  params: Promise<{ token: string }>;
}>;

export default async function ReferenceSubmissionPage(props: PageProps) {
  const { token } = await props.params;

  // 1. Verify the HMAC token
  const result = verifyReferenceToken(token);

  if (!result.valid) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="mx-auto max-w-md rounded-xl bg-surface-container-lowest p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-light">
            <span className="text-2xl text-error">!</span>
          </div>
          <h1 className="mb-2 text-xl font-semibold text-on-surface">
            Invalid or Expired Link
          </h1>
          <p className="text-sm text-[--color-on-surface-variant]">
            This reference link has expired or is invalid. Please ask the
            service provider to send a new request.
          </p>
        </div>
      </div>
    );
  }

  // 2. Fetch the reference row
  const supabase = createAdminClient();
  const { data: reference, error: refError } = await supabase
    .from("provider_references")
    .select("id, status, referee_name, reference_type")
    .eq("id", result.referenceId)
    .single();

  if (refError || !reference) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="mx-auto max-w-md rounded-xl bg-surface-container-lowest p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-light">
            <span className="text-2xl text-error">!</span>
          </div>
          <h1 className="mb-2 text-xl font-semibold text-on-surface">
            Reference Not Found
          </h1>
          <p className="text-sm text-[--color-on-surface-variant]">
            We could not find this reference request. It may have been removed.
            Please contact the service provider for assistance.
          </p>
        </div>
      </div>
    );
  }

  // 3. Check if already submitted
  if (reference.status !== "pending") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="mx-auto max-w-md rounded-xl bg-surface-container-lowest p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
            <span className="text-2xl text-success">&#10003;</span>
          </div>
          <h1 className="mb-2 text-xl font-semibold text-on-surface">
            Already Submitted
          </h1>
          <p className="text-sm text-[--color-on-surface-variant]">
            Thank you! This reference has already been submitted.
          </p>
        </div>
      </div>
    );
  }

  // 4. Fetch provider name
  const { data: provider } = await supabase
    .from("service_provider_details")
    .select("business_name")
    .eq("user_id", result.providerId)
    .single();

  const providerName = provider?.business_name ?? "this provider";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <RefereeSubmissionForm
        referenceId={reference.id}
        token={token}
        refereeName={reference.referee_name ?? ""}
        providerName={providerName}
        referenceType={reference.reference_type ?? "client"}
      />
    </div>
  );
}

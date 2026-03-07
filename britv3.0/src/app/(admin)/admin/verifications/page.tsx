import { createClient } from "@/lib/supabase/server";
import { getVerificationQueue } from "@/services/admin-service";
import { VerificationQueueClient } from "@/components/admin/VerificationQueueClient";

export default async function AdminVerificationsPage() {
  const supabase = await createClient();
  const verifications = await getVerificationQueue(supabase);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Provider Verifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review pending provider verification applications.{" "}
          {verifications.length} item{verifications.length !== 1 ? "s" : ""} awaiting
          review.
        </p>
      </div>

      <VerificationQueueClient verifications={verifications} />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { listProviderMatchedRfqs } from "@/services/marketplace/rfq-service";
import type { ServiceRequest } from "@/types/marketplace";
import JobsBoardClient from "./JobsBoardClient";

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rfqs: ServiceRequest[] = [];
  let total = 0;

  if (user) {
    try {
      const result = await listProviderMatchedRfqs(supabase, user.id, 20, 0);
      rfqs = result.data;
      total = result.count;
    } catch {
      // Provider profile may not exist yet — show empty state
    }
  }

  return <JobsBoardClient rfqs={rfqs} total={total} />;
}

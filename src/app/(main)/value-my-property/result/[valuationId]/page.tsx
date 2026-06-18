import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getResultForUser } from "@/services/valuation/session-repo";
import { ResultView } from "@/components/valuation/ResultView";

export const metadata: Metadata = {
  title: "Your property estimate | Britestate",
  robots: { index: false },
};

export default async function ResultPage({
  params,
}: {
  params: Promise<{ valuationId: string }>;
}) {
  const { valuationId } = await params;

  // Authorisation: a result is only ever shown to the verified user who owns it.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/value-my-property/verify-email");
  }

  const valuation = await getResultForUser(valuationId, user.id);
  if (!valuation) {
    notFound(); // not owned / does not exist — no enumeration signal
  }

  return <ResultView valuation={valuation} />;
}

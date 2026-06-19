import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getResultForUser } from "@/services/valuation/session-repo";
import { AgentLeadForm } from "@/components/valuation/AgentLeadForm";

export const metadata: Metadata = {
  title: "Get a local expert valuation | TrueDeed",
  robots: { index: false },
};

const WHY = [
  "Interior condition and finish",
  "Recent renovations and extensions",
  "Views, plot quality and aspect",
  "Street-specific and current buyer demand",
  "Unusual features an automated model can't see",
];

export default async function ExpertValuationPage({
  params,
}: {
  params: Promise<{ valuationId: string }>;
}) {
  const { valuationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/value-my-property/verify-email");

  const valuation = await getResultForUser(valuationId, user.id);
  if (!valuation) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
          Get a local expert valuation
        </h1>
        <p className="mt-2 text-neutral-600">
          An automated estimate is a useful guide, but a local estate agent can value your home in
          person and account for things data can&apos;t:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-600">
          {WHY.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </header>

      <AgentLeadForm valuationId={valuation.id} />
    </div>
  );
}

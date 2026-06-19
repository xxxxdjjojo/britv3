import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StepShell } from "@/components/valuation/StepShell";
import { DetailsStep } from "@/components/valuation/DetailsStep";
import { getSessionByToken } from "@/services/valuation/session-repo";
import { VALUATION_SESSION_COOKIE } from "@/lib/valuation/session-token";

export const metadata: Metadata = {
  title: "Property details | Value my property",
  robots: { index: false },
};

export default async function DetailsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(VALUATION_SESSION_COOKIE)?.value;
  const session = token ? await getSessionByToken(token) : null;
  if (!session?.address) redirect("/value-my-property/address");

  return (
    <StepShell
      current={2}
      title="Confirm your property details"
      description={`${session.address.label}, ${session.address.postcode}. Check what we know and add anything missing.`}
    >
      <DetailsStep initial={session.details} />
    </StepShell>
  );
}

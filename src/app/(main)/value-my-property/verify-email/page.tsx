import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StepShell } from "@/components/valuation/StepShell";
import { VerifyEmailStep } from "@/components/valuation/VerifyEmailStep";
import { getSessionByToken } from "@/services/valuation/session-repo";
import { VALUATION_SESSION_COOKIE } from "@/lib/valuation/session-token";

export const metadata: Metadata = {
  title: "Verify your email | Value my property",
  robots: { index: false },
};

export default async function VerifyEmailPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(VALUATION_SESSION_COOKIE)?.value;
  const session = token ? await getSessionByToken(token) : null;
  if (!session?.address) redirect("/value-my-property/address");
  if (!session.latestResultId) redirect("/value-my-property/review");

  return (
    <StepShell
      current={4}
      title="Verify your email to view your estimate"
      description="Your indicative estimate is ready. Confirm a one-time code to reveal and save it."
    >
      <VerifyEmailStep />
    </StepShell>
  );
}

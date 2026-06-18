import type { Metadata } from "next";
import { cookies } from "next/headers";
import { StepShell } from "@/components/valuation/StepShell";
import { AddressStep } from "@/components/valuation/AddressStep";
import { getSessionByToken } from "@/services/valuation/session-repo";
import { VALUATION_SESSION_COOKIE } from "@/lib/valuation/session-token";

export const metadata: Metadata = {
  title: "Find your property | Value my property",
  robots: { index: false },
};

export default async function AddressPage({
  searchParams,
}: {
  searchParams: Promise<{ postcode?: string }>;
}) {
  const { postcode } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(VALUATION_SESSION_COOKIE)?.value;
  const session = token ? await getSessionByToken(token) : null;
  const initialPostcode = session?.address?.postcode ?? postcode;

  return (
    <StepShell
      current={1}
      title="Find your property"
      description="Enter your postcode and choose your exact address. You'll verify your email later to view and save the estimate."
    >
      <AddressStep initialPostcode={initialPostcode} />
    </StepShell>
  );
}

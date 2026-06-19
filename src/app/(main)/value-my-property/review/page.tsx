import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StepShell } from "@/components/valuation/StepShell";
import { ReviewStep } from "@/components/valuation/ReviewStep";
import { getSessionByToken } from "@/services/valuation/session-repo";
import { VALUATION_SESSION_COOKIE } from "@/lib/valuation/session-token";

export const metadata: Metadata = {
  title: "Review | Value my property",
  robots: { index: false },
};

const SUBTYPE_LABEL: Record<string, string> = {
  detached: "Detached house",
  semi_detached: "Semi-detached house",
  terraced: "Terraced house",
  end_terrace: "End-of-terrace house",
  bungalow: "Bungalow",
  flat: "Flat / maisonette",
  other: "Other",
};
const TENURE_LABEL: Record<string, string> = {
  freehold: "Freehold",
  leasehold: "Leasehold",
  share_of_freehold: "Share of freehold",
  unknown: "Not sure",
};

export default async function ReviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(VALUATION_SESSION_COOKIE)?.value;
  const session = token ? await getSessionByToken(token) : null;
  if (!session?.address) redirect("/value-my-property/address");
  if (!session.details) redirect("/value-my-property/details");

  const d = session.details;
  const rows = [
    { label: "Address", value: `${session.address.label}, ${session.address.postcode}` },
    { label: "Property type", value: SUBTYPE_LABEL[d.subtype] ?? d.subtype },
    { label: "Bedrooms", value: d.bedrooms?.toString() ?? "Not given" },
    { label: "Bathrooms", value: d.bathrooms?.toString() ?? "Not given" },
    { label: "Floor area", value: d.floorAreaSqm ? `${d.floorAreaSqm} m²` : "Not given" },
    { label: "Tenure", value: TENURE_LABEL[d.tenure] ?? d.tenure },
    { label: "New build", value: d.newBuild ? "Yes" : "No" },
  ];

  return (
    <StepShell
      current={3}
      title="Review and calculate"
      description="Check your details, then we'll calculate your indicative estimate. You'll verify your email to view it."
    >
      <ReviewStep summary={{ rows }} />
    </StepShell>
  );
}

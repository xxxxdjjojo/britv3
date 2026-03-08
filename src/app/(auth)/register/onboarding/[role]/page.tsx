import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/auth/OnboardingFlow";
import type { UserRole } from "@/types/auth";

const VALID_ROLES: UserRole[] = [
  "homebuyer",
  "renter",
  "seller",
  "landlord",
  "agent",
  "service_provider",
];

export default async function OnboardingPage(
  props: Readonly<{
    params: Promise<{ role: string }>;
  }>,
) {
  const { role } = await props.params;

  if (!VALID_ROLES.includes(role as UserRole)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <OnboardingFlow role={role as UserRole} />
    </div>
  );
}

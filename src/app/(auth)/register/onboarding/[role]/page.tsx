import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/auth/OnboardingFlow";
import { resolveRoleSlug } from "./slug-mapping";

export default async function OnboardingPage(
  props: Readonly<{
    params: Promise<{ role: string }>;
  }>,
) {
  const { role: rawRole } = await props.params;
  const resolvedRole = resolveRoleSlug(rawRole);

  if (!resolvedRole) {
    redirect("/register/role-select");
  }

  return (
    <div className="space-y-6">
      <OnboardingFlow role={resolvedRole} />
    </div>
  );
}

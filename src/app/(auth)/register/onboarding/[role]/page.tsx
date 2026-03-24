import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/auth/OnboardingFlow";
import { VALID_ROLES, resolveRoleSlug } from "./slug-mapping";

export default async function OnboardingPage(
  props: Readonly<{
    params: Promise<{ role: string }>;
  }>,
) {
  const { role: rawRole } = await props.params;
  const resolvedRole = resolveRoleSlug(rawRole);

  if (!VALID_ROLES.includes(resolvedRole)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <OnboardingFlow role={resolvedRole} />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { BuyerOnboarding } from "./onboarding/BuyerOnboarding";
import { SellerOnboarding } from "./onboarding/SellerOnboarding";

// Placeholder components for roles not yet implemented — will be replaced in Tasks 17-20
function PlaceholderOnboarding(props: Readonly<{ roleName: string; onComplete: () => void; onSkip: () => void }>) {
  return (
    <div className="space-y-4 text-center py-8">
      <p className="text-neutral-500 text-sm">{props.roleName} onboarding coming soon</p>
      <div className="flex gap-3 justify-center">
        <button onClick={props.onSkip} className="text-sm text-neutral-400 hover:underline">Skip</button>
        <button onClick={props.onComplete} className="text-sm text-brand-primary font-medium hover:underline">Continue to Dashboard</button>
      </div>
    </div>
  );
}

type WizardProps = Readonly<{ onComplete: () => void; onSkip: () => void }>;

function LandlordPlaceholder(p: WizardProps) {
  return <PlaceholderOnboarding roleName="Landlord" {...p} />;
}

function AgentPlaceholder(p: WizardProps) {
  return <PlaceholderOnboarding roleName="Estate Agent" {...p} />;
}

function ServiceProviderPlaceholder(p: WizardProps) {
  return <PlaceholderOnboarding roleName="Tradesperson" {...p} />;
}

function MortgageBrokerPlaceholder(p: WizardProps) {
  return <PlaceholderOnboarding roleName="Mortgage Broker" {...p} />;
}

const WIZARD_MAP: Record<string, React.ComponentType<WizardProps>> = {
  homebuyer: BuyerOnboarding,
  renter: BuyerOnboarding,
  seller: SellerOnboarding,
  landlord: LandlordPlaceholder,
  agent: AgentPlaceholder,
  service_provider: ServiceProviderPlaceholder,
  mortgage_broker: MortgageBrokerPlaceholder,
};

export function OnboardingFlow(props: Readonly<{ role: string }>) {
  const router = useRouter();

  const Wizard = WIZARD_MAP[props.role];

  if (!Wizard) {
    router.push("/dashboard");
    return null;
  }

  return (
    <Wizard
      onComplete={() => router.push("/dashboard")}
      onSkip={() => router.push("/dashboard")}
    />
  );
}

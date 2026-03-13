"use client";

import { useRouter } from "next/navigation";
import { AgentOnboarding } from "./onboarding/AgentOnboarding";
import { BuyerOnboarding } from "./onboarding/BuyerOnboarding";
import { LandlordOnboarding } from "./onboarding/LandlordOnboarding";
import { MortgageBrokerOnboarding } from "./onboarding/MortgageBrokerOnboarding";
import { SellerOnboarding } from "./onboarding/SellerOnboarding";
import { TradespersonOnboarding } from "./onboarding/TradespersonOnboarding";

type WizardProps = Readonly<{ onComplete: () => void; onSkip: () => void }>;

const WIZARD_MAP: Record<string, React.ComponentType<WizardProps>> = {
  homebuyer: BuyerOnboarding,
  renter: BuyerOnboarding,
  seller: SellerOnboarding,
  landlord: LandlordOnboarding,
  agent: AgentOnboarding,
  service_provider: TradespersonOnboarding,
  mortgage_broker: MortgageBrokerOnboarding,
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

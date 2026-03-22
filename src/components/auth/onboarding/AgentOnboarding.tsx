"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfessionalOnboardingLayout } from "@/components/auth/ProfessionalOnboardingLayout";
import { TrustCallout } from "@/components/ui/TrustCallout";
import { EntityTypeStep } from "./steps/EntityTypeStep";
import { CompaniesHouseStep } from "./steps/CompaniesHouseStep";
import { SoleTraderStep } from "./steps/SoleTraderStep";
import { ProfessionalBodyStep } from "./steps/ProfessionalBodyStep";
import { KycStep } from "./steps/KycStep";
import { PhotoUploadStep } from "./steps/PhotoUploadStep";
import { ProfessionalDetailsStep } from "./steps/ProfessionalDetailsStep";
import { ServiceAreasStep } from "./steps/ServiceAreasStep";
import { BioSpecialtiesStep } from "./steps/BioSpecialtiesStep";
import { SocialLinksStep } from "./steps/SocialLinksStep";
import { PlanGoLiveStep } from "./steps/PlanGoLiveStep";
import type { EntityType } from "@/types/auth";

const TOTAL_STEPS = 10;

const STEP_CONFIG = [
  { label: "Business Entity Type", subtitle: "Choose how your business is structured" },
  { label: "Business Verification", subtitle: "Verify your business registration" },
  { label: "Professional Bodies", subtitle: "Add your professional memberships" },
  { label: "Identity Verification", subtitle: "Complete KYC for the verified badge" },
  { label: "Professional Photo", subtitle: "Add a photo to boost enquiries" },
  { label: "Professional Details", subtitle: "Share your experience and contact info" },
  { label: "Service Areas", subtitle: "Where do you operate?" },
  { label: "Bio & Specialties", subtitle: "Tell clients about yourself" },
  { label: "Online Presence", subtitle: "Link your website and social profiles" },
  { label: "Choose Plan & Go Live", subtitle: "Review your profile and launch" },
] as const;

export function AgentOnboarding(
  props: Readonly<{
    onComplete: () => void;
    onSkip: () => void;
  }>,
) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  const configIndex = step - 1;
  const config = STEP_CONFIG[configIndex] ?? STEP_CONFIG[0];

  function getTrustCallout() {
    switch (step) {
      case 1:
        return (
          <TrustCallout title="Why we ask">
            UK property regulations require estate agents and letting agents to register under
            either a limited company or as a sole trader. This determines your verification path.
          </TrustCallout>
        );
      case 2:
        return (
          <TrustCallout title="Companies House">
            We verify your company directly with Companies House to ensure legitimacy.
            Your company data auto-fills — no manual entry needed.
          </TrustCallout>
        );
      case 3:
        return (
          <TrustCallout title="Professional Accreditation">
            Memberships in NAEA, ARLA, RICS, and HMRC AML increase your trust score
            and help clients feel confident choosing you.
          </TrustCallout>
        );
      case 6:
        return (
          <TrustCallout title="Profile Completeness">
            Complete profiles receive 3x more enquiries. Photos alone boost
            engagement by 40%.
          </TrustCallout>
        );
      default:
        return null;
    }
  }

  function handleComplete() {
    router.push("/dashboard");
  }

  return (
    <ProfessionalOnboardingLayout
      currentStep={step}
      totalSteps={TOTAL_STEPS}
      stepLabel={config.label}
      subtitle={config.subtitle}
      trustCallout={getTrustCallout()}
    >
      {step === 1 && (
        <EntityTypeStep
          defaultValue={entityType ?? undefined}
          onSubmit={(type) => {
            setEntityType(type);
            next();
          }}
          onBack={props.onSkip}
        />
      )}

      {step === 2 && entityType === "ltd_company" && (
        <CompaniesHouseStep
          stepNumber={2}
          onSubmit={(data) => {
            setCompanyName(data.company_name);
            next();
          }}
          onBack={back}
        />
      )}

      {step === 2 && entityType === "sole_trader" && (
        <SoleTraderStep
          stepNumber={2}
          onSubmit={() => next()}
          onBack={back}
        />
      )}

      {step === 3 && (
        <ProfessionalBodyStep
          stepNumber={3}
          onSubmit={() => next()}
          onBack={back}
          onSkip={() => next()}
        />
      )}

      {step === 4 && (
        <KycStep
          stepNumber={4}
          onSubmit={() => next()}
          onBack={back}
          onSkip={() => next()}
        />
      )}

      {step === 5 && (
        <PhotoUploadStep
          stepNumber={5}
          onSubmit={(url) => {
            setPhotoUrl(url);
            next();
          }}
          onBack={back}
          onSkip={() => next()}
        />
      )}

      {step === 6 && (
        <ProfessionalDetailsStep
          stepNumber={6}
          defaultDisplayName=""
          defaultAgencyName={companyName}
          onSubmit={() => next()}
          onBack={back}
        />
      )}

      {step === 7 && (
        <ServiceAreasStep
          stepNumber={7}
          onSubmit={() => next()}
          onBack={back}
        />
      )}

      {step === 8 && (
        <BioSpecialtiesStep
          stepNumber={8}
          onSubmit={() => next()}
          onBack={back}
          onSkip={() => next()}
        />
      )}

      {step === 9 && (
        <SocialLinksStep
          stepNumber={9}
          onSubmit={() => next()}
          onBack={back}
          onSkip={() => next()}
        />
      )}

      {step === 10 && (
        <PlanGoLiveStep
          stepNumber={10}
          displayName=""
          agencyName={companyName}
          photoUrl={photoUrl || undefined}
          verified={false}
          onComplete={handleComplete}
          onBack={back}
        />
      )}
    </ProfessionalOnboardingLayout>
  );
}

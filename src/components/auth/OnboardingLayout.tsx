import { WizardStepper } from "@/components/auth/WizardStepper";

export function OnboardingLayout(
  props: Readonly<{
    steps: string[];
    currentStep: number;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }>,
) {
  return (
    <div className="space-y-6">
      <WizardStepper steps={props.steps} currentStep={props.currentStep} />
      <div className="space-y-1">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          {props.title}
        </h2>
        {props.subtitle && (
          <p className="font-sans text-sm text-neutral-500">{props.subtitle}</p>
        )}
      </div>
      {props.children}
    </div>
  );
}

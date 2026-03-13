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
      <div>
        <h2 className="font-heading text-xl font-bold text-neutral-900">{props.title}</h2>
        {props.subtitle && (
          <p className="mt-1 font-body text-sm text-neutral-500">{props.subtitle}</p>
        )}
      </div>
      {props.children}
    </div>
  );
}

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { VerificationStep } from "@/services/provider/provider-verification-service";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [k: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { VerificationStepper } from "./VerificationStepper";

const makeStep = (
  overrides: Partial<VerificationStep> = {},
): VerificationStep => ({
  stepId: "id_check",
  step_number: 1,
  label: "Identity Verification",
  description: "Government-issued ID required.",
  status: "not_started",
  required: true,
  updatedAt: null,
  rejectionReason: null,
  ...overrides,
});

describe("VerificationStepper", () => {
  it("renders all step labels", () => {
    const steps: VerificationStep[] = [
      makeStep({ stepId: "id_check", label: "Identity Verification" }),
      makeStep({
        stepId: "insurance",
        step_number: 2,
        label: "Insurance Documents",
        status: "approved",
      }),
    ];
    render(<VerificationStepper steps={steps} />);
    expect(screen.getByText("Identity Verification")).toBeInTheDocument();
    expect(screen.getByText("Insurance Documents")).toBeInTheDocument();
  });

  it("shows 'Get started' action for not_started steps", () => {
    render(<VerificationStepper steps={[makeStep({ stepId: "insurance" })]} />);
    expect(screen.getByRole("link", { name: /get started/i })).toBeInTheDocument();
  });

  it("renders a session-start button (not a link) for the id_check step", () => {
    render(<VerificationStepper steps={[makeStep({ stepId: "id_check" })]} />);
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /get started/i })).not.toBeInTheDocument();
  });

  it("hides action link for approved steps", () => {
    render(
      <VerificationStepper
        steps={[makeStep({ status: "approved" })]}
      />,
    );
    expect(screen.queryByRole("link", { name: /get started/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /continue/i })).toBeNull();
  });

  it("shows rejection reason when status is rejected", () => {
    render(
      <VerificationStepper
        steps={[
          makeStep({
            stepId: "insurance",
            status: "rejected",
            rejectionReason: "Document expired.",
          }),
        ]}
      />,
    );
    expect(screen.getByText(/Document expired/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /re-apply/i })).toBeInTheDocument();
  });

  it("shows 'Under review' badge for submitted steps", () => {
    render(<VerificationStepper steps={[makeStep({ status: "submitted" })]} />);
    expect(screen.getByText("Under review")).toBeInTheDocument();
  });

  it("marks required steps with Required badge", () => {
    render(<VerificationStepper steps={[makeStep({ required: true })]} />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("renders empty list without crashing", () => {
    const { container } = render(<VerificationStepper steps={[]} />);
    expect(container.firstChild).toBeTruthy();
  });
});

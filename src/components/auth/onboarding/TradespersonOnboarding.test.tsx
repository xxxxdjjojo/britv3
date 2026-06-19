import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { TradespersonOnboarding } from "./TradespersonOnboarding";

// The component never reaches the network in these tests (it stays on step 0),
// but it imports createClient at module scope, so stub it.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }),
    }),
  }),
}));

function renderOnboarding() {
  const onComplete = vi.fn();
  const onSkip = vi.fn();
  render(<TradespersonOnboarding onComplete={onComplete} onSkip={onSkip} />);
  return { onComplete, onSkip };
}

describe("TradespersonOnboarding step 0", () => {
  it("renders a business or trading name input", () => {
    renderOnboarding();
    expect(screen.getByLabelText(/business or trading name/i)).toBeInTheDocument();
  });

  it("disables Continue until a trade is selected and the name is >= 3 chars", () => {
    renderOnboarding();

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeDisabled();

    // Trade selected but no name -> still disabled.
    fireEvent.click(screen.getByRole("button", { name: /^plumber$/i }));
    expect(continueBtn).toBeDisabled();

    const nameInput = screen.getByLabelText(/business or trading name/i);

    // Name too short (2 chars) -> still disabled.
    fireEvent.change(nameInput, { target: { value: "Ab" } });
    expect(continueBtn).toBeDisabled();

    // Name reaches 3 chars + trade selected -> enabled.
    fireEvent.change(nameInput, { target: { value: "Abc" } });
    expect(continueBtn).toBeEnabled();
  });

  it("keeps Continue disabled when only the name is filled (no trade)", () => {
    renderOnboarding();

    fireEvent.change(screen.getByLabelText(/business or trading name/i), {
      target: { value: "Acme Plumbing" },
    });
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("calls onSkip when Skip for now is clicked", () => {
    const { onSkip } = renderOnboarding();
    fireEvent.click(screen.getByRole("button", { name: /skip for now/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WaitlistForm } from "@/components/coming-soon/WaitlistForm";

describe("WaitlistForm", () => {
  it("renders an email field and a labelled submit button", () => {
    render(<WaitlistForm />);

    const emailInput = screen.getByRole("textbox");
    expect(emailInput).toBeInTheDocument();

    const submit = screen.getByRole("button");
    expect(submit).toBeInTheDocument();
    expect(submit.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });
});

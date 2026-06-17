import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FCAVerificationPage from "./page";

describe("FCAVerificationPage", () => {
  it("renders the FCA Registration page heading", () => {
    render(<FCAVerificationPage />);
    // h1 heading
    expect(
      screen.getByRole("heading", { level: 1, name: /fca registration/i }),
    ).toBeInTheDocument();
  });

  it("renders the Verification Steps section", () => {
    render(<FCAVerificationPage />);
    expect(screen.getByText(/verification steps/i)).toBeInTheDocument();
    // "FCA Number" appears in both stepper and form label — use getAllBy
    expect(screen.getAllByText(/fca number/i).length).toBeGreaterThan(0);
    // "Indemnity Insurance" appears in stepper and doc list — use getAllBy
    expect(screen.getAllByText(/indemnity insurance/i).length).toBeGreaterThan(0);
    // "Trading Name" appears in stepper and doc list — use getAllBy
    expect(screen.getAllByText(/trading name/i).length).toBeGreaterThan(0);
  });

  it("renders the Confirm Trading Identity action card", () => {
    render(<FCAVerificationPage />);
    expect(
      screen.getByRole("heading", { level: 2, name: /confirm trading identity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/primary trading name/i),
    ).toBeInTheDocument();
  });

  it("renders the Complete Verification and Back to Uploads buttons", () => {
    render(<FCAVerificationPage />);
    expect(
      screen.getByRole("button", { name: /complete verification/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back to uploads/i }),
    ).toBeInTheDocument();
  });

  it("renders the Document Verification progress section", () => {
    render(<FCAVerificationPage />);
    expect(screen.getByText(/document verification/i)).toBeInTheDocument();
    // 2 of 4 docs are verified
    expect(screen.getByText(/2\/4 verified/i)).toBeInTheDocument();
  });

  it("renders the Review Timeline and Bank-grade Security info tiles", () => {
    render(<FCAVerificationPage />);
    expect(screen.getByText(/review timeline/i)).toBeInTheDocument();
    expect(screen.getByText(/bank-grade security/i)).toBeInTheDocument();
  });
});

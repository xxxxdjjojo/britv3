import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BrokerProfilePage from "./page";

describe("BrokerProfilePage", () => {
  it("renders the editorial page heading", () => {
    render(<BrokerProfilePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /your professional identity/i }),
    ).toBeInTheDocument();
  });

  it("renders the Bio & Professional Details section card", () => {
    render(<BrokerProfilePage />);
    expect(
      screen.getByRole("heading", { level: 2, name: /bio & professional details/i }),
    ).toBeInTheDocument();
  });

  it("renders the Areas of Specialism section card", () => {
    render(<BrokerProfilePage />);
    expect(
      screen.getByRole("heading", { level: 2, name: /areas of specialism/i }),
    ).toBeInTheDocument();
  });

  it("renders specialism toggle buttons", () => {
    render(<BrokerProfilePage />);
    expect(screen.getByRole("button", { name: /first-time buyers/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buy-to-let/i })).toBeInTheDocument();
  });

  it("renders the Save Changes action button", () => {
    render(<BrokerProfilePage />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("renders the FCA Verified Broker card with the FCA number", () => {
    render(<BrokerProfilePage />);
    expect(screen.getByText(/verified broker/i)).toBeInTheDocument();
    expect(screen.getByText(/FCA 123456/)).toBeInTheDocument();
  });

  it("renders the Live Status toggle switch", () => {
    render(<BrokerProfilePage />);
    expect(screen.getByRole("switch", { name: "" })).toBeInTheDocument();
  });
});

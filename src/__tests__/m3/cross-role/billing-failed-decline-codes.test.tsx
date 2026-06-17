import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// The DECLINE_MESSAGES lookup lives inline in the failed page and is not
// exported, so we exercise the mapping by driving the decline_code search param.
let declineCode = "";
vi.mock("next/navigation", () => ({
  useParams: () => ({ role: "agent" }),
  useSearchParams: () => new URLSearchParams(declineCode ? `decline_code=${declineCode}` : ""),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import PaymentFailedPage from "@/app/(protected)/dashboard/[role]/billing/failed/page";

function renderWithCode(code: string) {
  declineCode = code;
  return render(<PaymentFailedPage />);
}

describe("PaymentFailed decline_code → message mapping", () => {
  const cases: ReadonlyArray<{ code: string; title: string }> = [
    { code: "insufficient_funds", title: "Insufficient funds" },
    { code: "card_declined", title: "Card declined" },
    { code: "expired_card", title: "Card expired" },
    { code: "incorrect_cvc", title: "Incorrect CVC" },
    { code: "processing_error", title: "Processing error" },
    { code: "incorrect_number", title: "Incorrect card number" },
    { code: "card_not_supported", title: "Card not supported" },
    { code: "currency_not_supported", title: "Currency not supported" },
    { code: "do_not_honor", title: "Transaction not authorised" },
    { code: "fraudulent", title: "Transaction flagged" },
    { code: "lost_card", title: "Card reported lost" },
    { code: "stolen_card", title: "Card reported stolen" },
    { code: "withdrawal_count_limit_exceeded", title: "Transaction limit reached" },
  ];

  it.each(cases)("maps '$code' to title '$title'", ({ code, title }) => {
    renderWithCode(code);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  });

  it("falls back to the default message for an unknown code", () => {
    renderWithCode("some_unknown_code");
    expect(screen.getByRole("heading", { name: "Payment failed" })).toBeInTheDocument();
  });

  it("falls back to the default message when no code is present", () => {
    renderWithCode("");
    expect(screen.getByRole("heading", { name: "Payment failed" })).toBeInTheDocument();
  });

  it("renders the recommended-advice copy for a known code", () => {
    renderWithCode("expired_card");
    expect(screen.getByText("Recommended next step")).toBeInTheDocument();
    expect(
      screen.getByText("Update your card details or use a different card."),
    ).toBeInTheDocument();
  });

  it("always offers a path back to billing and payment methods", () => {
    renderWithCode("card_declined");
    expect(screen.getByText("Back to billing")).toBeInTheDocument();
    expect(screen.getByText("Manage your payment methods")).toBeInTheDocument();
  });
});

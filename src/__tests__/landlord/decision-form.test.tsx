// src/__tests__/landlord/decision-form.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DecisionForm } from "@/components/landlord/DecisionForm";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("DecisionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "approved" }),
    }) as unknown as typeof fetch;
  });

  it("renders Accept and Reject controls for an active application", () => {
    render(<DecisionForm applicationId="app-1" status="received" applicantName="Jane Smith" />);
    expect(screen.getByRole("button", { name: /accept application/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /reject/i })).toBeInTheDocument();
  });

  it("posts an accept decision to the API and navigates back to the list", async () => {
    render(<DecisionForm applicationId="app-1" status="received" applicantName="Jane Smith" />);
    fireEvent.click(screen.getByRole("button", { name: /accept application/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/landlord/applications/app-1/decision",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ action: "accept" }),
        }),
      );
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard/landlord/tenants"));
  });

  it("does not submit a rejection without a 10+ character reason", () => {
    render(<DecisionForm applicationId="app-1" status="received" applicantName="Jane Smith" />);
    fireEvent.click(screen.getByRole("tab", { name: /reject/i }));
    const rejectBtn = screen.getByRole("button", { name: /reject application/i });
    expect(rejectBtn).toBeDisabled();
  });

  it("posts a reject decision with the reason when provided", async () => {
    render(<DecisionForm applicationId="app-1" status="received" applicantName="Jane Smith" />);
    fireEvent.click(screen.getByRole("tab", { name: /reject/i }));
    fireEvent.change(screen.getByLabelText(/rejection reason/i), {
      target: { value: "Insufficient income for the rent" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reject application/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/landlord/applications/app-1/decision",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ action: "reject", reason: "Insufficient income for the rent" }),
        }),
      );
    });
  });

  it("shows an already-decided banner and no action buttons for a terminal status", () => {
    render(<DecisionForm applicationId="app-1" status="approved" applicantName="Jane Smith" />);
    expect(screen.getByText(/already been approved/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept application/i })).not.toBeInTheDocument();
  });
});

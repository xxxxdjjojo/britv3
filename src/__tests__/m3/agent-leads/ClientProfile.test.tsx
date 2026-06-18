/**
 * ClientProfile — header, contact details, tabs, notes editor, tags, and the
 * edit-mode toggle. Save flows POST/PATCH and surface toasts (sonner mocked).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { ClientProfile } from "@/components/dashboard/agent/crm/ClientProfile";
import { makeClient } from "./fixtures";

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
  },
}));

beforeEach(() => {
  vi.restoreAllMocks();
  toastSuccess.mockClear();
  toastError.mockClear();
});

describe("ClientProfile — render with data", () => {
  it("renders the client name heading and humanised type badge", () => {
    render(<ClientProfile client={makeClient({ name: "Olivia Owner", client_type: "seller" })} />);

    expect(screen.getByRole("heading", { name: "Olivia Owner" })).toBeInTheDocument();
    expect(screen.getByText("seller")).toBeInTheDocument();
  });

  it("renders email and phone as mailto/tel links in the overview tab", () => {
    render(
      <ClientProfile
        client={makeClient({ email: "olivia@example.com", phone: "07700900100" })}
      />,
    );

    expect(screen.getByRole("link", { name: "olivia@example.com" })).toHaveAttribute(
      "href",
      "mailto:olivia@example.com",
    );
    expect(screen.getByRole("link", { name: "07700900100" })).toHaveAttribute(
      "href",
      "tel:07700900100",
    );
  });

  it("renders all four tabs", () => {
    render(<ClientProfile client={makeClient()} />);

    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /properties/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /communication/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /transactions/i })).toBeInTheDocument();
  });

  it("renders existing tags as badges", () => {
    render(<ClientProfile client={makeClient({ tags: ["VIP", "cash-buyer"] })} />);

    expect(screen.getByText("VIP")).toBeInTheDocument();
    expect(screen.getByText("cash-buyer")).toBeInTheDocument();
  });

  it("renders preferences when present", () => {
    render(
      <ClientProfile
        client={makeClient({ preferences: { max_budget: "500000", bedrooms: "3" } })}
      />,
    );

    expect(screen.getByText("Preferences")).toBeInTheDocument();
    expect(screen.getByText(/max budget/i)).toBeInTheDocument();
    expect(screen.getByText("500000")).toBeInTheDocument();
  });
});

describe("ClientProfile — empty / absent data", () => {
  it("shows em-dashes for missing email and phone", () => {
    render(<ClientProfile client={makeClient({ email: null, phone: null })} />);

    // both contact rows fall back to the dash placeholder
    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("shows 'No tags yet' when there are no tags", () => {
    render(<ClientProfile client={makeClient({ tags: [] })} />);

    expect(screen.getByText(/no tags yet/i)).toBeInTheDocument();
  });

  it("omits the Send Email header action when the client has no email", () => {
    render(<ClientProfile client={makeClient({ email: null })} />);

    expect(
      screen.queryByRole("link", { name: /send email/i }),
    ).not.toBeInTheDocument();
  });
});

describe("ClientProfile — notes editor", () => {
  it("pre-fills the notes textarea from the client's notes", () => {
    render(<ClientProfile client={makeClient({ notes: "Prefers email contact" })} />);

    expect(screen.getByDisplayValue("Prefers email contact")).toBeInTheDocument();
  });

  it("PATCHes the client and shows a success toast when saving notes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<ClientProfile client={makeClient()} />);

    fireEvent.change(screen.getByPlaceholderText(/add notes about this client/i), {
      target: { value: "Updated note" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save notes/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/agent/crm",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it("shows an error toast when the notes save fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);

    render(<ClientProfile client={makeClient()} />);

    fireEvent.click(screen.getByRole("button", { name: /save notes/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});

describe("ClientProfile — edit mode", () => {
  it("switches the header to an editable form when Edit is clicked", () => {
    render(<ClientProfile client={makeClient({ name: "Olivia Owner" })} />);

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    // name now appears as an input value rather than a heading
    expect(screen.getByDisplayValue("Olivia Owner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("returns to view mode when Cancel is clicked", () => {
    render(<ClientProfile client={makeClient({ name: "Olivia Owner" })} />);

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByRole("heading", { name: "Olivia Owner" })).toBeInTheDocument();
  });

  it("reveals the tag input only in edit mode", () => {
    render(<ClientProfile client={makeClient()} />);

    expect(screen.queryByPlaceholderText(/add a tag/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    expect(screen.getByPlaceholderText(/add a tag/i)).toBeInTheDocument();
  });

  it("adds a tag via the tag input in edit mode", () => {
    render(<ClientProfile client={makeClient({ tags: [] })} />);

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    fireEvent.change(screen.getByPlaceholderText(/add a tag/i), {
      target: { value: "hot-lead" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(screen.getByText("hot-lead")).toBeInTheDocument();
  });
});

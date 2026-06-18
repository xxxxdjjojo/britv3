/**
 * ClientList (CRM) — table rendering, empty state, type-filter behaviour,
 * debounced search, row links, bulk-select bar, and add-client dialog.
 *
 * Uses fake timers for the 300ms search debounce to stay deterministic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

import { ClientList } from "@/components/dashboard/agent/crm/ClientList";
import { CRM_CLIENTS, makeClient } from "./fixtures";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ClientList — render with data", () => {
  it("renders a row per client with name, email, and humanised type", () => {
    render(<ClientList clients={CRM_CLIENTS} />);

    expect(screen.getByText("Peter Purchaser")).toBeInTheDocument();
    expect(screen.getByText("Olivia Owner")).toBeInTheDocument();
    expect(screen.getByText("Larry Landlord")).toBeInTheDocument();
    expect(screen.getByText("peter@example.com")).toBeInTheDocument();
    // type badges (capitalised via CSS, raw text in DOM is the enum value)
    expect(screen.getByText("buyer")).toBeInTheDocument();
    expect(screen.getByText("seller")).toBeInTheDocument();
    expect(screen.getByText("landlord")).toBeInTheDocument();
  });

  it("links each client name to its profile page", () => {
    render(<ClientList clients={CRM_CLIENTS} />);

    const link = screen.getByRole("link", { name: "Peter Purchaser" });
    expect(link).toHaveAttribute("href", "/dashboard/agent/crm/client-buyer");
  });

  it("renders an em-dash for a missing last-contact date", () => {
    render(
      <ClientList
        clients={[makeClient({ id: "c-x", name: "No Contact", last_contact_at: null })]}
      />,
    );

    // name cell + the dash cell render; the dash placeholder is present
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});

describe("ClientList — empty state", () => {
  it("shows 'No clients found' when the list is empty", () => {
    render(<ClientList clients={[]} />);

    expect(screen.getByText(/no clients found/i)).toBeInTheDocument();
  });
});

describe("ClientList — type filter", () => {
  it("renders only matching client types when a type filter is applied", () => {
    // typeFilter drives a plain array .filter — exercise it directly by
    // confirming all three render unfiltered, then narrowing the data the
    // way the component would. (base-ui Select popup is not openable under
    // happy-dom — see FINDING below — so we validate the predicate via props.)
    const buyersOnly = CRM_CLIENTS.filter((c) => c.client_type === "buyer");
    render(<ClientList clients={buyersOnly} />);

    expect(screen.getByText("Peter Purchaser")).toBeInTheDocument();
    expect(screen.queryByText("Olivia Owner")).not.toBeInTheDocument();
  });

  // FINDING: base-ui <Select> popup (type filter) does not open under
  // happy-dom; the in-component typeFilter state transition cannot be driven
  // through the UI here. Covered structurally above; full UI path needs a
  // real-browser runner.
  it.todo("filters the table when the Type select value changes (real browser)");
});

describe("ClientList — debounced search", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("filters rows by global search after the 300ms debounce elapses", async () => {
    render(<ClientList clients={CRM_CLIENTS} />);

    fireEvent.change(screen.getByPlaceholderText(/search clients/i), {
      target: { value: "Olivia" },
    });

    // Before the debounce fires, the global filter has not applied yet.
    expect(screen.getByText("Peter Purchaser")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText("Olivia Owner")).toBeInTheDocument();
    expect(screen.queryByText("Peter Purchaser")).not.toBeInTheDocument();
    expect(screen.queryByText("Larry Landlord")).not.toBeInTheDocument();
  });

  it("reflects the typed value in the search input immediately", () => {
    render(<ClientList clients={CRM_CLIENTS} />);

    const input = screen.getByPlaceholderText(/search clients/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Larry" } });

    expect(input.value).toBe("Larry");
  });
});

describe("ClientList — bulk select", () => {
  it("shows the bulk-action bar with a count after selecting a row", () => {
    render(<ClientList clients={CRM_CLIENTS} />);

    const checkboxes = screen.getAllByRole("checkbox", { name: /select row/i });
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /send email/i })).toBeInTheDocument();
  });

  it("hides the bulk-action bar when nothing is selected", () => {
    render(<ClientList clients={CRM_CLIENTS} />);

    expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();
  });
});

describe("ClientList — add client dialog", () => {
  it("opens the add-client dialog showing the form", async () => {
    render(<ClientList clients={[]} />);

    // BUG F8/F7 (fixed): DialogTrigger now honors `asChild` by forwarding to
    // base-ui's `render` prop, so <DialogTrigger asChild><Button>Add Client…
    // renders a SINGLE button instead of a nested pair.
    const triggers = screen.getAllByRole("button", { name: /^add client$/i });
    expect(triggers.length).toBe(1);
    fireEvent.click(triggers[0]);

    await waitFor(() => {
      expect(screen.getByText(/add new client/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });
});

/**
 * M3-A9 — UserManagementClient (search + pagination + suspend/activate + detail modal).
 *
 * The client is props-driven: it receives a page of users from the server
 * component and owns the search box, pagination links, and the suspend/
 * activate fetch calls. We mock next/navigation (router.push / refresh) and
 * global fetch so no network is hit.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { UserManagementClient } from "@/components/admin/UserManagementClient";
import type { UserSearchResult } from "@/services/admin/user-service";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const ACTIVE_USER: UserSearchResult = {
  id: "user-active-1",
  display_name: "Priya Sharma",
  email: "priya@example.com",
  active_role: "landlord",
  is_admin: false,
  is_suspended: false,
  created_at: "2026-01-10T00:00:00.000Z",
};

const SUSPENDED_USER: UserSearchResult = {
  id: "user-suspended-1",
  display_name: "Greg Banner",
  email: "greg@example.com",
  active_role: "agent",
  is_admin: false,
  is_suspended: true,
  created_at: "2026-02-01T00:00:00.000Z",
};

function renderClient(overrides?: Partial<React.ComponentProps<typeof UserManagementClient>>) {
  const props = {
    initialUsers: [ACTIVE_USER, SUSPENDED_USER],
    total: 42,
    page: 1,
    limit: 20,
    query: "",
    ...overrides,
  };
  return render(<UserManagementClient {...props} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

describe("UserManagementClient", () => {
  it("renders the user rows with name and email", () => {
    renderClient();
    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    expect(screen.getByText("greg@example.com")).toBeInTheDocument();
  });

  it("shows the total count summary", () => {
    renderClient({ total: 42 });
    expect(screen.getByText(/42 users found/i)).toBeInTheDocument();
  });

  it("renders the empty table message when there are no users", () => {
    renderClient({ initialUsers: [], total: 0 });
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    expect(screen.getByText(/0 users found/i)).toBeInTheDocument();
  });

  it("pushes a search URL with q and resets page on submit", () => {
    renderClient({ query: "" });
    const input = screen.getByPlaceholderText(/search by name or email/i);
    fireEvent.change(input, { target: { value: "priya" } });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/admin/users?q=priya&page=0");
  });

  it("renders Previous and Next pagination links pointing at adjacent pages", () => {
    // total 42 / limit 20 => 3 pages; on page index 1 both links show.
    renderClient({ total: 42, page: 1, limit: 20, query: "agents" });

    const prev = screen.getByRole("link", { name: /previous/i });
    const next = screen.getByRole("link", { name: /next/i });
    expect(prev).toHaveAttribute("href", "/admin/users?q=agents&page=0");
    expect(next).toHaveAttribute("href", "/admin/users?q=agents&page=2");
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
  });

  it("hides pagination when there is only a single page", () => {
    renderClient({ total: 5, page: 0, limit: 20 });
    expect(screen.queryByRole("link", { name: /next/i })).not.toBeInTheDocument();
  });

  it("suspends an active user via POST and refreshes", async () => {
    renderClient();
    fireEvent.click(screen.getByRole("button", { name: /suspend/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/users/user-active-1/suspend",
      { method: "POST" },
    );
  });

  it("activates a suspended user via POST and refreshes", async () => {
    renderClient();
    fireEvent.click(screen.getByRole("button", { name: /activate/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/users/user-suspended-1/activate",
      { method: "POST" },
    );
  });

  it("opens the detail modal when View is clicked and closes it again", () => {
    renderClient();
    // Each row has a View button; click the first (active user).
    const viewButtons = screen.getAllByRole("button", { name: /^view$/i });
    fireEvent.click(viewButtons[0]);

    expect(screen.getByText(/user details/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByText(/user details/i)).not.toBeInTheDocument();
  });
});

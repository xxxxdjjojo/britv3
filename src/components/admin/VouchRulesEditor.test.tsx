import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VouchRulesEditor } from "./VouchRulesEditor";
import type { VouchRules } from "@/types/provider-dashboard";

const RULES: VouchRules = {
  id: true,
  required_peer_vouches: 3,
  required_client_vouches: 3,
  client_recency_days: 90,
  invite_expiry_days: 30,
  resend_cooldown_hours: 24,
  gate_enabled: false,
  updated_at: null,
  updated_by: null,
};

describe("VouchRulesEditor", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the current rule values", () => {
    render(<VouchRulesEditor rules={RULES} />);
    expect(screen.getByLabelText(/Required peer vouches/)).toHaveValue(3);
    expect(screen.getByLabelText(/Client recency window/)).toHaveValue(90);
    expect(
      screen.getByRole("checkbox", { name: /Enforce vouch requirements/ }),
    ).not.toBeChecked();
  });

  it("PUTs changed values", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ rules: { ...RULES, required_peer_vouches: 5 } }),
    });

    render(<VouchRulesEditor rules={RULES} />);
    fireEvent.change(screen.getByLabelText(/Required peer vouches/), {
      target: { value: "5" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Enforce vouch requirements/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Save rules/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/vouch-rules");
    expect((init as RequestInit).method).toBe("PUT");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.required_peer_vouches).toBe(5);
    expect(body.gate_enabled).toBe(true);
  });

  it("clearing a required-positive field blocks submit with a validation error and does NOT PUT", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;

    render(<VouchRulesEditor rules={RULES} />);
    // Clear the client-recency window (min 1) → NaN, out of bounds.
    fireEvent.change(screen.getByLabelText(/Client recency window/), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save rules/ }));

    expect(
      await screen.findByText(
        /Enter a valid value for Client recency window/,
      ),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    // Submit stays disabled while the form is invalid.
    expect(screen.getByRole("button", { name: /Save rules/ })).toBeDisabled();
  });
});

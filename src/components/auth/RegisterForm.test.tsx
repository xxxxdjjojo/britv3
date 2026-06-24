import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// next/navigation
const push = vi.fn();
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => search,
}));

// auth service
const signUp = vi.fn(async (..._args: unknown[]) => ({ data: { user: { id: "u1" } }, error: null }));
vi.mock("@/services/auth/auth-service", () => ({ signUp: (...a: unknown[]) => signUp(...a) }));

// supabase client (role assignment + consent are non-blocking)
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    rpc: async () => ({ data: null, error: null }),
    from: () => ({ upsert: async () => ({ data: null, error: null }) }),
  }),
}));

import { RegisterForm } from "./RegisterForm";

describe("RegisterForm — consumer signup (buyer/renter)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search = new URLSearchParams(); // no ?professional= → consumer
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    });
  });

  it("does NOT render first/last name fields for a consumer", () => {
    render(<RegisterForm />);
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("lets a consumer register with only email + password (no names required)", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "buyer@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password123" },
    });
    fireEvent.click(screen.getByLabelText(/Terms of Service/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
    const [email, password] = signUp.mock.calls[0];
    expect(email).toBe("buyer@example.com");
    expect(password).toBe("Password123");
  });
});

describe("RegisterForm — professional signup (unchanged)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search = new URLSearchParams("professional=agent");
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    });
  });

  it("STILL renders first/last name fields for a professional", async () => {
    render(<RegisterForm />);
    await waitFor(() =>
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  });
});

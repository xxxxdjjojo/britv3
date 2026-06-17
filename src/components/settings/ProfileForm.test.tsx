// src/components/settings/ProfileForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileForm } from "@/components/settings/ProfileForm";

// -- Module mocks -------------------------------------------------------------

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// -- Fixtures -----------------------------------------------------------------

const BASE_PROPS = {
  initialData: {
    first_name: "Jane",
    last_name: "Doe",
    phone: "+44 7700 900000",
    postcode: "SW1A 1AA",
    bio: null,
    email: "jane.doe@example.com",
  },
} as const;

// -- Tests --------------------------------------------------------------------

describe("ProfileForm", () => {
  it("renders the Identity & Contact section heading and core fields", () => {
    render(<ProfileForm {...BASE_PROPS} />);

    // Form fields present and populated
    expect(screen.getByLabelText(/first name/i)).toHaveValue("Jane");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe");
    expect(screen.getByLabelText(/email/i)).toHaveValue("jane.doe@example.com");
    expect(screen.getByLabelText(/phone/i)).toHaveValue("+44 7700 900000");
    expect(screen.getByLabelText(/postcode/i)).toHaveValue("SW1A 1AA");
  });

  it("renders the Save Changes button", () => {
    render(<ProfileForm {...BASE_PROPS} />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("renders the Cancel button", () => {
    render(<ProfileForm {...BASE_PROPS} />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("does not render agent fields when activeRole is not agent", () => {
    render(<ProfileForm {...BASE_PROPS} activeRole="landlord" />);
    expect(screen.queryByLabelText(/agency name/i)).not.toBeInTheDocument();
  });

  it("renders agent fields when activeRole is agent", () => {
    render(
      <ProfileForm
        {...BASE_PROPS}
        activeRole="agent"
        roleData={{ agency_name: "Foxtons", specializations: [], coverage_areas: [] }}
      />,
    );
    expect(screen.getByLabelText(/agency name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/specialisations/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/coverage areas/i)).toBeInTheDocument();
  });
});

// M3-A1 — Certificate upload form UI: field rendering, category hints,
// validation messages, and disabled-submit state. Does NOT perform an upload.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { mockRouter } from "@/__tests__/mocks/next";

// Mock client-side-only deps the form imports at module load.
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  })),
}));

import ComplianceUploadForm from "@/components/landlord/ComplianceUploadForm";

const PROPERTIES = [
  { id: "11111111-1111-1111-1111-111111111111", address: "42 Baker Street" },
  { id: "22222222-2222-2222-2222-222222222222", address: "9 Elm Court" },
];

describe("ComplianceUploadForm — rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the property options from props", () => {
    render(<ComplianceUploadForm properties={PROPERTIES} />);
    expect(screen.getByRole("option", { name: "42 Baker Street" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "9 Elm Court" })).toBeInTheDocument();
  });

  it("renders all certificate category options", () => {
    render(<ComplianceUploadForm properties={PROPERTIES} />);
    expect(
      screen.getByRole("option", { name: "Gas Safety Certificate (CP12)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Energy Performance Certificate (EPC)" }),
    ).toBeInTheDocument();
  });

  it("shows the UK compliance hint for the default gas_safety category", () => {
    render(<ComplianceUploadForm properties={PROPERTIES} />);
    expect(
      screen.getByText(/Must be carried out by a Gas Safe registered engineer/),
    ).toBeInTheDocument();
  });

  it("swaps the hint when the category changes", async () => {
    render(<ComplianceUploadForm properties={PROPERTIES} />);
    fireEvent.change(screen.getByLabelText(/Certificate Type/), {
      target: { value: "epc" },
    });
    expect(await screen.findByText(/Valid for 10 years/)).toBeInTheDocument();
  });

  it("disables the submit button while no file is selected", () => {
    render(<ComplianceUploadForm properties={PROPERTIES} />);
    expect(
      screen.getByRole("button", { name: /Upload Certificate/ }),
    ).toBeDisabled();
  });
});

describe("ComplianceUploadForm — validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation messages when required fields are empty on submit", async () => {
    render(<ComplianceUploadForm properties={PROPERTIES} />);

    // Submit the form directly (button is disabled without a file, so dispatch submit).
    const form = screen.getByRole("button", { name: /Upload Certificate/ }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(await screen.findByText("Select a property")).toBeInTheDocument();
    expect(screen.getByText("Expiry date is required")).toBeInTheDocument();
    expect(
      screen.getByText("Document name required (min 3 characters)"),
    ).toBeInTheDocument();
  });

  it("rejects a past expiry date with a future-date message", async () => {
    render(<ComplianceUploadForm properties={PROPERTIES} />);

    fireEvent.change(screen.getByLabelText(/Property/), {
      target: { value: PROPERTIES[0].id },
    });
    fireEvent.change(screen.getByLabelText(/Document Name/), {
      target: { value: "Gas Cert 2020" },
    });
    fireEvent.change(screen.getByLabelText(/Expiry Date/), {
      target: { value: "2000-01-01" },
    });

    const form = screen.getByRole("button", { name: /Upload Certificate/ }).closest("form");
    fireEvent.submit(form!);

    expect(
      await screen.findByText("Expiry date must be in the future"),
    ).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";
import type { ProviderProfileInput } from "@/lib/validators/marketplace-schemas";

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

import { ProviderProfileForm } from "@/components/provider/ProviderProfileForm";

// happy-dom does not reliably translate a submit-button click into a form
// submit event, so fire the submit on the <form> element directly.
function submitForm(container: HTMLElement): void {
  const form = container.querySelector("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

const VALID_REQUIRED: Partial<ProviderProfileInput> = {
  business_name: "Acme Plumbing Ltd",
  business_description:
    "We provide reliable plumbing services across London with over a decade of experience.",
  services: ["plumber"],
  service_postcodes: [],
  service_radius: 25,
  years_in_business: 5,
};

beforeEach(() => {
  toastMock.success.mockReset();
  toastMock.error.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// BUG F9: empty optional pricing inputs registered with { valueAsNumber: true }
// resolve to NaN, which fails the optional z.number() pricing schema and
// silently blocks an otherwise-valid submit (dead Submit button, no error).
describe("ProviderProfileForm pricing (BUG F9)", () => {
  it("submits when optional pricing fields are left blank", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(
      <ProviderProfileForm defaultValues={{ ...VALID_REQUIRED, pricing: undefined }} />,
    );
    submitForm(container);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/providers/profile",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    expect(toastMock.success).toHaveBeenCalledWith(
      "Profile created successfully",
    );
  });

  it("submits a valid numeric pricing value as a number", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(
      <ProviderProfileForm
        defaultValues={{
          ...VALID_REQUIRED,
          pricing: { call_out_fee: 50, hourly_rate: 40, day_rate: 280 },
        }}
      />,
    );
    submitForm(container);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.pricing.call_out_fee).toBe(50);
    expect(body.pricing.hourly_rate).toBe(40);
    expect(body.pricing.day_rate).toBe(280);
  });
});

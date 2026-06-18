import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ProviderProfileInput } from "@/lib/validators/marketplace-schemas";

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

import { ProviderProfileForm } from "@/components/provider/ProviderProfileForm";

// happy-dom does not reliably translate a click on a type="submit" button into
// the form's submit event, so trigger submission on the <form> directly. This
// exercises the real react-hook-form handleSubmit path deterministically.
function submitForm(container: HTMLElement): void {
  const form = container.querySelector("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

// NOTE: pricing is supplied explicitly. The three pricing <input type="number">
// fields register with { valueAsNumber: true }; when left blank they resolve to
// NaN, which fails the (optional) z.number() pricing schema and silently blocks
// submission. See the documented FINDING test below. Providing numeric pricing
// here lets the happy-path submission tests actually reach onSubmit.
const VALID_DEFAULTS: Partial<ProviderProfileInput> = {
  business_name: "Acme Plumbing Ltd",
  business_description:
    "We provide reliable plumbing services across London with over a decade of experience.",
  services: ["plumber"],
  service_postcodes: [],
  service_radius: 25,
  years_in_business: 5,
  pricing: { call_out_fee: 50, hourly_rate: 40, day_rate: 280 },
};

beforeEach(() => {
  toastMock.success.mockReset();
  toastMock.error.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ProviderProfileForm", () => {
  describe("render", () => {
    it("renders create-mode fields and submit button", () => {
      render(<ProviderProfileForm />);
      expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Create Profile/i }),
      ).toBeInTheDocument();
    });

    it("renders Update Profile button in edit mode", () => {
      render(<ProviderProfileForm isEdit />);
      expect(
        screen.getByRole("button", { name: /Update Profile/i }),
      ).toBeInTheDocument();
    });

    it("renders the full services checklist as toggle buttons", () => {
      render(<ProviderProfileForm />);
      // A representative sample of the 20 categories.
      expect(screen.getByRole("button", { name: "Plumber" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Electrician" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Conveyancing" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Painter & Decorator" })).toBeInTheDocument();
    });

    it("prefills fields from defaultValues", () => {
      render(<ProviderProfileForm defaultValues={VALID_DEFAULTS} />);
      expect(
        screen.getByDisplayValue("Acme Plumbing Ltd"),
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(/reliable plumbing services/i),
      ).toBeInTheDocument();
    });
  });

  describe("services multi-select (config checklist)", () => {
    it("toggles a service on and off", () => {
      render(<ProviderProfileForm />);
      const plumber = screen.getByRole("button", { name: "Plumber" });

      // Selected state is reflected via the primary border/text classes.
      expect(plumber.className).not.toMatch(/text-primary/);
      fireEvent.click(plumber);
      expect(plumber.className).toMatch(/text-primary/);
      fireEvent.click(plumber);
      expect(plumber.className).not.toMatch(/text-primary/);
    });

    it("pre-selects services passed via defaultValues", () => {
      render(
        <ProviderProfileForm defaultValues={{ services: ["electrician"] }} />,
      );
      expect(
        screen.getByRole("button", { name: "Electrician" }).className,
      ).toMatch(/text-primary/);
    });
  });

  describe("service-area: postcodes", () => {
    it("adds a postcode via the Add button, uppercasing it", () => {
      render(<ProviderProfileForm />);
      const input = screen.getByPlaceholderText(/SW1A, EC2V/i);
      fireEvent.change(input, { target: { value: "sw1a" } });
      fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

      expect(screen.getByText("SW1A")).toBeInTheDocument();
      expect((input as HTMLInputElement).value).toBe("");
    });

    it("adds a postcode on Enter key", () => {
      render(<ProviderProfileForm />);
      const input = screen.getByPlaceholderText(/SW1A, EC2V/i);
      fireEvent.change(input, { target: { value: "ec2v" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(screen.getByText("EC2V")).toBeInTheDocument();
    });

    it("rejects a duplicate postcode with an error toast", () => {
      render(<ProviderProfileForm />);
      const input = screen.getByPlaceholderText(/SW1A, EC2V/i);
      fireEvent.change(input, { target: { value: "n1" } });
      fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));
      fireEvent.change(input, { target: { value: "n1" } });
      fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

      expect(toastMock.error).toHaveBeenCalledWith("Postcode already added");
      expect(screen.getAllByText("N1")).toHaveLength(1);
    });

    it("removes a postcode via its remove control", () => {
      render(
        <ProviderProfileForm
          defaultValues={{ service_postcodes: ["SW1A"] }}
        />,
      );
      expect(screen.getByText("SW1A")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Remove SW1A/i }));
      expect(screen.queryByText("SW1A")).not.toBeInTheDocument();
    });
  });

  describe("service-area: radius slider", () => {
    it("renders the radius label with the default value", () => {
      render(<ProviderProfileForm />);
      expect(screen.getByText(/Service Radius: 25 miles/i)).toBeInTheDocument();
    });

    it("reflects a non-default radius from defaultValues", () => {
      render(<ProviderProfileForm defaultValues={{ service_radius: 50 }} />);
      expect(screen.getByText(/Service Radius: 50 miles/i)).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("blocks submission and shows field errors when required fields are empty", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const { container } = render(<ProviderProfileForm />);
      submitForm(container);

      // services requires at least one entry; name/description also error.
      expect(
        await screen.findByText(/Select at least one service category/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Business name must be at least 3 characters/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Description must be at least 50 characters/i),
      ).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // FIXED (BUG F9): The three pricing inputs previously registered with
  // { valueAsNumber: true }. When left blank (the common case for a provider
  // who does not publish rates), their values became NaN, which failed the
  // optional z.number() pricing schema. react-hook-form then silently blocked
  // submission, leaving a dead Submit button. The fix registers them with
  // setValueAs so a blank field resolves to undefined and the optional schema
  // passes.
  describe("empty pricing no longer blocks submission", () => {
    it("submits when pricing fields are left blank", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      vi.stubGlobal("fetch", fetchMock);

      // Required fields valid, but no pricing -> inputs render blank.
      const noPricing: Partial<ProviderProfileInput> = {
        ...VALID_DEFAULTS,
        pricing: undefined,
      };
      const { container } = render(
        <ProviderProfileForm defaultValues={noPricing} />,
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
  });

  describe("submission (fetch mocked, form submitted directly)", () => {
    it("POSTs valid data and shows a success toast in create mode", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      vi.stubGlobal("fetch", fetchMock);
      const onSuccess = vi.fn();

      const { container } = render(
        <ProviderProfileForm
          defaultValues={VALID_DEFAULTS}
          onSuccess={onSuccess}
        />,
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
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("PUTs in edit mode and shows the updated toast", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      vi.stubGlobal("fetch", fetchMock);

      const { container } = render(
        <ProviderProfileForm isEdit defaultValues={VALID_DEFAULTS} />,
      );
      submitForm(container);

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/providers/profile",
          expect.objectContaining({ method: "PUT" }),
        ),
      );
      expect(toastMock.success).toHaveBeenCalledWith(
        "Profile updated successfully",
      );
    });

    it("shows the server error message on a failed response", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Business name already taken" }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const { container } = render(
        <ProviderProfileForm defaultValues={VALID_DEFAULTS} />,
      );
      submitForm(container);

      await waitFor(() =>
        expect(toastMock.error).toHaveBeenCalledWith(
          "Business name already taken",
        ),
      );
    });

    it("surfaces a network rejection as an error toast", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Offline"));
      vi.stubGlobal("fetch", fetchMock);

      const { container } = render(
        <ProviderProfileForm defaultValues={VALID_DEFAULTS} />,
      );
      submitForm(container);

      await waitFor(() =>
        expect(toastMock.error).toHaveBeenCalledWith("Offline"),
      );
    });
  });
});

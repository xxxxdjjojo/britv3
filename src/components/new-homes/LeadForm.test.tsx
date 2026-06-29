import { describe, expect, test, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LeadForm } from "./LeadForm";

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

const VALID_UUID = "b0000000-0000-0000-0000-000000000001";

describe("LeadForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("blocks submission and shows an error when required fields are empty", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(
      <LeadForm developmentId={VALID_UUID} leadType="register_interest" units={[]} />,
    );

    // Submit the form directly to exercise the component's own (schema)
    // validation rather than the browser's native required-field gate.
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(await screen.findByRole("alert")).toHaveTextContent(/full name/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("submits valid data to the leads API and shows confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, leadId: "lead-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LeadForm developmentId={VALID_UUID} leadType="register_interest" units={[]} />,
    );

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Jane Buyer" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    expect(await screen.findByText(/enquiry sent/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/new-homes/leads");
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body).toMatchObject({
      developmentId: VALID_UUID,
      leadType: "register_interest",
      name: "Jane Buyer",
      email: "jane@example.com",
    });
  });
});

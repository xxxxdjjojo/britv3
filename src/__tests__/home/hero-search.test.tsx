import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HomeSearchBar } from "@/components/search/HomeSearchBar";

// Mock the Next router so we can assert navigation targets.
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

describe("HomeSearchBar — real, wired location input", () => {
  it("renders an actual text input the user can type into", () => {
    render(<HomeSearchBar />);
    const input = screen.getByRole("textbox", { name: /search/i });
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("navigates to /search with the typed query on submit", () => {
    render(<HomeSearchBar />);
    const input = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(input, { target: { value: "Brighton" } });
    fireEvent.submit(input.closest("form")!);

    expect(push).toHaveBeenCalledTimes(1);
    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("/search?");
    const qs = new URLSearchParams(url.split("?")[1]);
    expect(qs.get("q")).toBe("Brighton");
    expect(qs.get("type")).toBe("buy"); // default tab
  });

  it("URL-encodes a multi-word location", () => {
    render(<HomeSearchBar />);
    const input = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(input, { target: { value: "Notting Hill" } });
    fireEvent.submit(input.closest("form")!);
    const qs = new URLSearchParams((push.mock.calls[0][0] as string).split("?")[1]);
    expect(qs.get("q")).toBe("Notting Hill");
  });

  it("submitting empty navigates to /search without a q param", () => {
    render(<HomeSearchBar />);
    const input = screen.getByRole("textbox", { name: /search/i });
    fireEvent.submit(input.closest("form")!);
    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("/search");
    expect(new URLSearchParams(url.split("?")[1] ?? "").has("q")).toBe(false);
  });

  it("respects the selected listing-type tab (Rent)", () => {
    render(<HomeSearchBar />);
    fireEvent.click(screen.getByRole("button", { name: /^rent$/i }));
    const input = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(input, { target: { value: "Leeds" } });
    fireEvent.submit(input.closest("form")!);
    const qs = new URLSearchParams((push.mock.calls[0][0] as string).split("?")[1]);
    expect(qs.get("type")).toBe("rent");
    expect(qs.get("q")).toBe("Leeds");
  });

  it("rent-scoped variant without tabs always navigates with type=rent", () => {
    render(<HomeSearchBar defaultType="rent" showTabs={false} />);
    expect(screen.queryByRole("button", { name: /^buy$/i })).not.toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(input, { target: { value: "M14" } });
    fireEvent.submit(input.closest("form")!);
    const qs = new URLSearchParams((push.mock.calls[0][0] as string).split("?")[1]);
    expect(qs.get("type")).toBe("rent");
    expect(qs.get("q")).toBe("M14");
  });
});

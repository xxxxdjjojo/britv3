import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../button";

// These guard the two ways callers render a Button "as a link" — the Radix-style
// `asChild` child and Base UI's `render` prop. Both must produce a real <a> (not a
// <button>) and must NOT trip Base UI's `nativeButton` dev warning. A regression
// here is what caused the dashboard hydration mismatch: the server fell back to a
// <button> while the client produced an <a>.

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Button", () => {
  it("renders a native <button> by default", () => {
    render(<Button>Save</Button>);
    const el = screen.getByRole("button", { name: "Save" });
    expect(el.tagName).toBe("BUTTON");
    expect(el).toHaveAttribute("data-slot", "button");
  });

  it("renders the child element as a link when `asChild` is set", () => {
    render(
      <Button asChild>
        <a href="/somewhere">Go somewhere</a>
      </Button>,
    );
    // The <a> keeps its native link semantics (navigable, open-in-new-tab) — it is
    // NOT coerced to role="button". Several pages assert these CTAs by link role.
    const el = screen.getByRole("link", { name: "Go somewhere" });
    expect(el.tagName).toBe("A");
    expect(el).toHaveAttribute("href", "/somewhere");
    expect(el).toHaveAttribute("data-slot", "button");
    // Button styling is merged onto the rendered element.
    expect(el.className).toContain("inline-flex");
  });

  it("renders the element passed via the `render` prop as a link with the button's children", () => {
    // Base UI convention (matches the Sidebar CTA): the render element is the
    // shell and the Button's children become its content.
    render(<Button render={<a href="/cta" />}>Primary CTA</Button>);
    const el = screen.getByRole("link", { name: "Primary CTA" });
    expect(el.tagName).toBe("A");
    expect(el).toHaveAttribute("href", "/cta");
    expect(el).toHaveAttribute("data-slot", "button");
  });

  it("does not emit Base UI's nativeButton warning when rendering as a link", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <Button asChild>
        <a href="/x">Link button</a>
      </Button>,
    );
    render(<Button render={<a href="/y" />}>Rendered link</Button>);

    const allCalls = [...errorSpy.mock.calls, ...warnSpy.mock.calls]
      .flat()
      .map(String)
      .join(" ");
    expect(allCalls).not.toMatch(/nativeButton/i);
    expect(allCalls).not.toMatch(/expected a native <button>/i);
  });
});

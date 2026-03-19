// src/__tests__/responsive/Stack.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stack } from "@/components/responsive/Stack";

describe("Stack", () => {
  it("renders children", () => {
    render(<Stack><div>A</div><div>B</div></Stack>);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("defaults to column direction", () => {
    const { container } = render(<Stack><div>A</div></Stack>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("flex-col");
  });

  it("accepts row direction", () => {
    const { container } = render(<Stack direction="row"><div>A</div></Stack>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("flex-row");
  });

  it("applies responsive direction", () => {
    const { container } = render(
      <Stack direction={{ default: "col", lg: "row" }}><div>A</div></Stack>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("flex-col");
    expect(el.className).toContain("lg:flex-row");
  });

  it("applies gap", () => {
    const { container } = render(<Stack gap={6}><div>A</div></Stack>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("gap-6");
  });

  it("applies alignment props", () => {
    const { container } = render(
      <Stack align="center" justify="between"><div>A</div></Stack>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("items-center");
    expect(el.className).toContain("justify-between");
  });
});

// src/__tests__/responsive/Container.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Container } from "@/components/responsive/Container";

describe("Container", () => {
  it("renders children", () => {
    render(<Container>Hello</Container>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies default xl max-width", () => {
    const { container } = render(<Container>Test</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("max-w-7xl");
  });

  it("applies responsive padding classes", () => {
    const { container } = render(<Container>Test</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("px-4");
    expect(el.className).toContain("sm:px-6");
    expect(el.className).toContain("lg:px-8");
  });

  it("accepts size prop", () => {
    const { container } = render(<Container size="sm">Test</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("max-w-2xl");
  });

  it("accepts custom className", () => {
    const { container } = render(<Container className="bg-error">Test</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("bg-error");
  });

  it("renders as specified element", () => {
    render(<Container as="section">Test</Container>);
    const el = screen.getByText("Test");
    expect(el.tagName).toBe("SECTION");
  });
});

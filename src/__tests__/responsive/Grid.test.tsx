// src/__tests__/responsive/Grid.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Grid } from "@/components/responsive/Grid";

describe("Grid", () => {
  it("renders children", () => {
    render(<Grid cols={2}><div>A</div><div>B</div></Grid>);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("applies static column count", () => {
    const { container } = render(<Grid cols={3}><div>A</div></Grid>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("grid-cols-3");
  });

  it("applies responsive column object", () => {
    const { container } = render(
      <Grid cols={{ default: 1, sm: 2, lg: 3 }}><div>A</div></Grid>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("grid-cols-1");
    expect(el.className).toContain("sm:grid-cols-2");
    expect(el.className).toContain("lg:grid-cols-3");
  });

  it("applies gap", () => {
    const { container } = render(<Grid cols={2} gap={6}><div>A</div></Grid>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("gap-6");
  });

  it("accepts custom className", () => {
    const { container } = render(<Grid cols={2} className="mt-4"><div>A</div></Grid>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("mt-4");
  });
});

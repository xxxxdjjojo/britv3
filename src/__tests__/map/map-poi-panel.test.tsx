/**
 * MapPoiPanel — unit tests (TDD: write first, RED → GREEN).
 *
 * Assertions:
 * 1. Renders a checkbox row for every category in POI_CATEGORIES (6 rows).
 * 2. A checkbox is checked iff its key is in `enabled`.
 * 3. Clicking a checkbox calls onToggle with the right key.
 * 4. Colour dot for each row has the correct data-poi-dot attribute.
 * 5. Collapse button toggles to pill and back.
 * 6. Collapse button has aria-expanded reflecting open state.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MapPoiPanel } from "../../components/map/MapPoiPanel";
import { POI_CATEGORIES, type PoiCategoryKey } from "../../lib/map/poi-categories";

// ── 1. Renders all 6 category rows ──────────────────────────────────────────

describe("MapPoiPanel — category rows", () => {
  it("renders a row for every category in POI_CATEGORIES", () => {
    render(
      <MapPoiPanel
        enabled={new Set<PoiCategoryKey>()}
        onToggle={vi.fn()}
      />,
    );

    for (const cat of POI_CATEGORIES) {
      expect(screen.getByText(cat.label)).toBeInTheDocument();
    }
  });

  it("renders exactly 6 checkboxes (one per category)", () => {
    render(
      <MapPoiPanel
        enabled={new Set<PoiCategoryKey>()}
        onToggle={vi.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(POI_CATEGORIES.length);
  });
});

// ── 2. Checked state matches `enabled` set ───────────────────────────────────

describe("MapPoiPanel — checked state", () => {
  it("checks only the keys present in enabled", () => {
    const enabled = new Set<PoiCategoryKey>(["leisure", "transport"]);
    render(<MapPoiPanel enabled={enabled} onToggle={vi.fn()} />);

    for (const cat of POI_CATEGORIES) {
      const checkbox = screen.getByRole("checkbox", { name: cat.label });
      if (enabled.has(cat.key)) {
        expect(checkbox).toBeChecked();
      } else {
        expect(checkbox).not.toBeChecked();
      }
    }
  });

  it("all checkboxes unchecked when enabled is empty", () => {
    render(
      <MapPoiPanel enabled={new Set<PoiCategoryKey>()} onToggle={vi.fn()} />,
    );
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).not.toBeChecked();
    }
  });

  it("all checkboxes checked when all keys are enabled", () => {
    const allEnabled = new Set<PoiCategoryKey>(
      POI_CATEGORIES.map((c) => c.key),
    );
    render(<MapPoiPanel enabled={allEnabled} onToggle={vi.fn()} />);
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeChecked();
    }
  });
});

// ── 3. onToggle called with correct key ──────────────────────────────────────

describe("MapPoiPanel — onToggle", () => {
  it("calls onToggle with 'shops' when the shops checkbox is clicked", () => {
    const onToggle = vi.fn();
    const enabled = new Set<PoiCategoryKey>(["leisure"]);
    render(<MapPoiPanel enabled={enabled} onToggle={onToggle} />);

    const shopsCategory = POI_CATEGORIES.find((c) => c.key === "shops")!;
    fireEvent.click(screen.getByRole("checkbox", { name: shopsCategory.label }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("shops");
  });

  it("calls onToggle with the key of each category when clicked", () => {
    const onToggle = vi.fn();
    render(
      <MapPoiPanel
        enabled={new Set<PoiCategoryKey>()}
        onToggle={onToggle}
      />,
    );

    for (const cat of POI_CATEGORIES) {
      fireEvent.click(screen.getByRole("checkbox", { name: cat.label }));
    }

    expect(onToggle).toHaveBeenCalledTimes(POI_CATEGORIES.length);
    for (const cat of POI_CATEGORIES) {
      expect(onToggle).toHaveBeenCalledWith(cat.key);
    }
  });
});

// ── 4. Colour dot has data-poi-dot attribute ──────────────────────────────────

describe("MapPoiPanel — colour dots", () => {
  it("each category row has a dot with data-poi-dot matching the category key", () => {
    render(
      <MapPoiPanel
        enabled={new Set<PoiCategoryKey>()}
        onToggle={vi.fn()}
      />,
    );

    for (const cat of POI_CATEGORIES) {
      const dot = document.querySelector(`[data-poi-dot="${cat.key}"]`);
      expect(dot).toBeInTheDocument();
    }
  });
});

// ── 5. Collapse / expand toggle ───────────────────────────────────────────────

describe("MapPoiPanel — collapse / expand", () => {
  it("starts open: checkboxes are visible", () => {
    render(
      <MapPoiPanel
        enabled={new Set<PoiCategoryKey>()}
        onToggle={vi.fn()}
      />,
    );
    // At least one checkbox visible = panel is open
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
  });

  it("clicking the collapse button hides the checkboxes and shows a pill", () => {
    render(
      <MapPoiPanel
        enabled={new Set<PoiCategoryKey>()}
        onToggle={vi.fn()}
      />,
    );

    // Click collapse (aria-label contains "Collapse")
    const collapseBtn = screen.getByRole("button", {
      name: /collapse points of interest/i,
    });
    fireEvent.click(collapseBtn);

    // Checkboxes should be gone
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);

    // Pill expand button should appear
    expect(
      screen.getByRole("button", { name: /show points of interest/i }),
    ).toBeInTheDocument();
  });

  it("clicking the pill re-opens the panel", () => {
    render(
      <MapPoiPanel
        enabled={new Set<PoiCategoryKey>()}
        onToggle={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /collapse points of interest/i }),
    );

    // Now collapsed — click the pill
    fireEvent.click(
      screen.getByRole("button", { name: /show points of interest/i }),
    );

    // Checkboxes back
    expect(screen.getAllByRole("checkbox")).toHaveLength(POI_CATEGORIES.length);
  });
});

// ── 6. aria-expanded on collapse button ──────────────────────────────────────

describe("MapPoiPanel — aria-expanded", () => {
  it("collapse button has aria-expanded=true when open", () => {
    render(
      <MapPoiPanel
        enabled={new Set<PoiCategoryKey>()}
        onToggle={vi.fn()}
      />,
    );
    const btn = screen.getByRole("button", {
      name: /collapse points of interest/i,
    });
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("pill button has aria-expanded=false when collapsed", () => {
    render(
      <MapPoiPanel
        enabled={new Set<PoiCategoryKey>()}
        onToggle={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /collapse points of interest/i }),
    );
    const pill = screen.getByRole("button", {
      name: /show points of interest/i,
    });
    expect(pill).toHaveAttribute("aria-expanded", "false");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock dnd-kit so tests run without a real drag context
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

import { PortfolioItemCard } from "./PortfolioItemCard";
import type { ProviderPortfolioItem } from "@/types/provider-dashboard";

const baseItem: ProviderPortfolioItem = {
  id: "item-1",
  provider_id: "prov-1",
  title: "Bathroom Refurbishment",
  description: "Full wet-room conversion",
  category: "plumbing",
  before_image_path: null,
  after_image_path: null,
  is_featured: false,
  display_order: 0,
  created_at: "2024-01-01T00:00:00Z",
};

describe("PortfolioItemCard", () => {
  it("renders the project title", () => {
    render(
      <PortfolioItemCard
        item={baseItem}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleFeatured={vi.fn()}
      />,
    );
    expect(screen.getByText("Bathroom Refurbishment")).toBeInTheDocument();
  });

  it("renders the category label badge", () => {
    render(
      <PortfolioItemCard
        item={baseItem}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleFeatured={vi.fn()}
      />,
    );
    // The category name appears in both the badge and the location row; assert at least one instance
    expect(screen.getAllByText("Plumbing").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the description when present", () => {
    render(
      <PortfolioItemCard
        item={baseItem}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleFeatured={vi.fn()}
      />,
    );
    expect(screen.getByText("Full wet-room conversion")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    render(
      <PortfolioItemCard
        item={baseItem}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onToggleFeatured={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTitle("Edit project"));
    expect(onEdit).toHaveBeenCalledWith(baseItem);
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(
      <PortfolioItemCard
        item={baseItem}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onToggleFeatured={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTitle("Delete project"));
    expect(onDelete).toHaveBeenCalledWith("item-1");
  });

  it("shows Featured badge when is_featured is true", () => {
    render(
      <PortfolioItemCard
        item={{ ...baseItem, is_featured: true }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleFeatured={vi.fn()}
      />,
    );
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("toggle switch reflects featured state via aria-checked", () => {
    render(
      <PortfolioItemCard
        item={{ ...baseItem, is_featured: true }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleFeatured={vi.fn()}
      />,
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onToggleFeatured when visibility switch is clicked", () => {
    const onToggleFeatured = vi.fn();
    render(
      <PortfolioItemCard
        item={baseItem}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleFeatured={onToggleFeatured}
      />,
    );
    fireEvent.click(screen.getByRole("switch"));
    expect(onToggleFeatured).toHaveBeenCalledWith("item-1", true);
  });
});

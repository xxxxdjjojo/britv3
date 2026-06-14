import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PipelinePage from "./page";

describe("PipelinePage", () => {
  it("renders the Pipeline Overview heading", () => {
    render(<PipelinePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /client pipeline/i }),
    ).toBeInTheDocument();
  });

  it("renders the editorial eyebrow", () => {
    render(<PipelinePage />);
    expect(screen.getByText(/active portfolios/i)).toBeInTheDocument();
  });

  it("renders Kanban column headers for key stages", () => {
    render(<PipelinePage />);
    expect(screen.getByText("New Lead")).toBeInTheDocument();
    expect(screen.getByText("Initial Consultation")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("renders client cards with names from mock data", () => {
    render(<PipelinePage />);
    expect(screen.getByText("Sarah Thompson")).toBeInTheDocument();
    expect(screen.getByText("Emma Wilson")).toBeInTheDocument();
  });

  it("renders the summary stat for active cases", () => {
    render(<PipelinePage />);
    expect(screen.getByText(/active cases/i)).toBeInTheDocument();
    expect(screen.getByText(/total volume/i)).toBeInTheDocument();
  });
});

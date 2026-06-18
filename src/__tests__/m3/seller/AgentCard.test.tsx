import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentCard } from "@/components/seller/agents/AgentCard";
import { makeAgent } from "./_fixtures";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("AgentCard render-with-data", () => {
  it("renders name, agency, rating and review count", () => {
    render(<AgentCard agent={makeAgent()} />);

    expect(screen.getByText("Carol Agent")).toBeInTheDocument();
    expect(screen.getByText("Prime Estates")).toBeInTheDocument();
    expect(screen.getByText("4.7")).toBeInTheDocument();
    expect(screen.getByText("(42)")).toBeInTheDocument();
  });

  it("renders fee, sold count and avg days stat tiles", () => {
    render(<AgentCard agent={makeAgent()} />);

    expect(screen.getByText("1.25%")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument(); // sold
    expect(screen.getByText("28")).toBeInTheDocument(); // avg days
  });

  it("renders at most 4 area chips", () => {
    render(<AgentCard agent={makeAgent()} />); // 5 areas in fixture
    expect(screen.getByText("Kensington")).toBeInTheDocument();
    expect(screen.getByText("Battersea")).toBeInTheDocument();
    expect(screen.queryByText("Wandsworth")).not.toBeInTheDocument();
  });

  it("links the View Profile button to the agent detail route", () => {
    render(<AgentCard agent={makeAgent({ id: "agent-99" })} />);
    const link = screen.getByRole("link", { name: "View Profile" });
    expect(link).toHaveAttribute("href", "/dashboard/seller/agents/agent-99");
  });
});

describe("AgentCard EMPTY / missing-data states", () => {
  it("hides rating row when average_rating is null", () => {
    render(<AgentCard agent={makeAgent({ average_rating: null })} />);
    expect(screen.queryByText("4.7")).not.toBeInTheDocument();
  });

  it("hides fee tile when fee_percentage is null", () => {
    render(<AgentCard agent={makeAgent({ fee_percentage: null })} />);
    expect(screen.queryByText("Fee")).not.toBeInTheDocument();
  });

  it("renders initial avatar when avatar_url is null", () => {
    render(<AgentCard agent={makeAgent({ avatar_url: null, full_name: "Zoe" })} />);
    expect(screen.getByText("Z")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders no area chips when areas_covered is empty", () => {
    render(<AgentCard agent={makeAgent({ areas_covered: [] })} />);
    expect(screen.queryByText("Kensington")).not.toBeInTheDocument();
  });
});

describe("AgentCard compare toggle gating (SELL-11)", () => {
  it("omits the Compare button entirely when onToggleCompare is not provided", () => {
    render(<AgentCard agent={makeAgent()} />);
    expect(screen.queryByRole("button", { name: /Compare/ })).not.toBeInTheDocument();
  });

  it("renders Compare button and fires the callback with the agent id", () => {
    const onToggleCompare = vi.fn();
    render(<AgentCard agent={makeAgent({ id: "agent-7" })} onToggleCompare={onToggleCompare} compareCount={0} />);

    fireEvent.click(screen.getByRole("button", { name: "Compare" }));
    expect(onToggleCompare).toHaveBeenCalledWith("agent-7");
  });

  it("disables Compare when 3 are already selected and this one is not selected", () => {
    render(
      <AgentCard agent={makeAgent()} onToggleCompare={vi.fn()} selected={false} compareCount={3} />,
    );
    expect(screen.getByRole("button", { name: "Compare" })).toBeDisabled();
  });

  it("keeps Compare enabled for an already-selected agent even at the cap", () => {
    render(
      <AgentCard agent={makeAgent()} onToggleCompare={vi.fn()} selected={true} compareCount={3} />,
    );
    expect(screen.getByRole("button", { name: /Compare/ })).toBeEnabled();
  });

  it("shows the selected check marker when selected", () => {
    render(<AgentCard agent={makeAgent()} onToggleCompare={vi.fn()} selected={true} />);
    expect(screen.getByRole("button", { name: "✓ Compare" })).toBeInTheDocument();
  });
});

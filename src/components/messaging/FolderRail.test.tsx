import { render, screen, within, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Folder } from "@/types/messaging";

import FolderRail from "./FolderRail";

const counts: Record<Folder, number> = {
  inbox: 3,
  unread: 2,
  sent: 5,
  drafts: 1,
  archived: 4,
  spam: 0,
};

describe("FolderRail", () => {
  it("renders all six folders with their labels", () => {
    render(<FolderRail activeFolder="inbox" counts={counts} onSelect={() => {}} />);

    const nav = screen.getByRole("navigation", { name: /folders/i });
    expect(within(nav).getByText("Inbox")).toBeInTheDocument();
    expect(within(nav).getByText("Unread")).toBeInTheDocument();
    expect(within(nav).getByText("Sent")).toBeInTheDocument();
    expect(within(nav).getByText("Drafts")).toBeInTheDocument();
    expect(within(nav).getByText("Archived")).toBeInTheDocument();
    expect(within(nav).getByText("Spam")).toBeInTheDocument();
  });

  it("shows the live count badge for folders with a non-zero count", () => {
    render(<FolderRail activeFolder="inbox" counts={counts} onSelect={() => {}} />);

    const inboxButton = screen.getByRole("button", { name: /inbox/i });
    expect(within(inboxButton).getByText("3")).toBeInTheDocument();

    const sentButton = screen.getByRole("button", { name: /sent/i });
    expect(within(sentButton).getByText("5")).toBeInTheDocument();
  });

  it("does not render a count badge when the folder count is zero", () => {
    render(<FolderRail activeFolder="inbox" counts={counts} onSelect={() => {}} />);

    const spamButton = screen.getByRole("button", { name: /spam/i });
    expect(within(spamButton).queryByText("0")).not.toBeInTheDocument();
  });

  it("marks the active folder with aria-current", () => {
    render(<FolderRail activeFolder="archived" counts={counts} onSelect={() => {}} />);

    const archivedButton = screen.getByRole("button", { name: /archived/i });
    expect(archivedButton).toHaveAttribute("aria-current", "true");

    const inboxButton = screen.getByRole("button", { name: /inbox/i });
    expect(inboxButton).not.toHaveAttribute("aria-current", "true");
  });

  it("calls onSelect with the folder id when a folder is clicked", () => {
    const onSelect = vi.fn();
    render(<FolderRail activeFolder="inbox" counts={counts} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /drafts/i }));

    expect(onSelect).toHaveBeenCalledWith("drafts");
  });
});

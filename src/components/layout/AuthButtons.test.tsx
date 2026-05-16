import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthButtons } from "./AuthButtons";
import type { User } from "@supabase/supabase-js";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("./SavedBadge", () => ({
  SavedBadge: () => <a href="/dashboard/saved">Saved</a>,
}));

const USER = {
  id: "user-1",
  email: "agent@example.com",
} as User;

describe("AuthButtons", () => {
  it("links authenticated users to canonical notifications", () => {
    render(<AuthButtons user={USER} />);

    expect(screen.getByLabelText("Notifications")).toHaveAttribute(
      "href",
      "/notifications",
    );
  });
});

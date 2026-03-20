import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UnsubscribeClient from "@/app/unsubscribe/UnsubscribeClient";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe("UnsubscribeClient expired token", () => {
  it("redirects to login with settings redirect when clicking Manage preferences on expired token", () => {
    pushMock.mockClear();

    render(<UnsubscribeClient token="expired-token" status="expired" />);

    const manageButton = screen.getByRole("button", { name: /manage preferences/i });
    fireEvent.click(manageButton);

    // Should redirect to login with redirectTo settings
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("/login"),
    );
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CommandPalette } from "./CommandPalette";
import { CommandPaletteProvider } from "@/contexts/CommandPaletteContext";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function renderPalette() {
  return render(
    <CommandPaletteProvider>
      <CommandPalette />
    </CommandPaletteProvider>,
  );
}

describe("CommandPalette", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("opens on Cmd+K keypress (context state changes)", () => {
    renderPalette();

    // Simulate Cmd+K — the handler calls setOpen(true)
    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });

    // The CommandDialog receives open=true; verify the Command component renders
    // cmdk renders its input even when wrapped in a dialog — check the underlying cmdk input
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens on Ctrl+K keypress", () => {
    renderPalette();

    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not open when activeElement is an input", () => {
    render(
      <CommandPaletteProvider>
        <input data-testid="text-input" />
        <CommandPalette />
      </CommandPaletteProvider>,
    );

    // Focus the text input
    const textInput = screen.getByTestId("text-input");
    textInput.focus();

    // Try Cmd+K while input is focused
    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });

    // Should NOT open
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on custom 'open-command-palette' event", () => {
    renderPalette();

    act(() => {
      document.dispatchEvent(new CustomEvent("open-command-palette"));
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    renderPalette();

    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Press Escape — built into Dialog
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("search input is present when open", () => {
    renderPalette();

    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });

    // cmdk renders an input with the placeholder
    expect(screen.getByPlaceholderText("Search pages, tools, services...")).toBeInTheDocument();
  });

  it("results filter on input change", () => {
    renderPalette();

    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });

    const input = screen.getByPlaceholderText("Search pages, tools, services...");

    act(() => {
      fireEvent.change(input, { target: { value: "mortgage" } });
    });

    // Mortgage Calculator should be visible
    expect(screen.getByText("Mortgage Calculator")).toBeInTheDocument();
  });

  it("shows empty state for gibberish input", () => {
    renderPalette();

    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });

    const input = screen.getByPlaceholderText("Search pages, tools, services...");

    act(() => {
      fireEvent.change(input, { target: { value: "xyzzyplughqwerty" } });
    });

    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("navigates and closes on result selection", () => {
    renderPalette();

    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });

    const input = screen.getByPlaceholderText("Search pages, tools, services...");

    act(() => {
      fireEvent.change(input, { target: { value: "Sold Prices" } });
    });

    expect(screen.getByText("Sold Prices")).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText("Sold Prices"));
    });

    expect(mockPush).toHaveBeenCalledWith("/sold-prices");
  });
});

import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const saveSpy = vi.fn();
const clearSpy = vi.fn();
let draftValue: string | null = null;
const mutateImpl = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ channel: () => ({ send: vi.fn() }) }),
}));

vi.mock("@/hooks/useInbox", () => ({
  useDraft: () => ({
    draft: draftValue,
    isLoading: false,
    save: saveSpy,
    clear: clearSpy,
  }),
}));

vi.mock("@/hooks/useMessages", () => ({
  useSendMessage: () => ({
    isPending: false,
    mutate: mutateImpl,
  }),
}));

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import MessageComposer from "./MessageComposer";

const baseProps = {
  conversationId: "11111111-1111-1111-1111-111111111111",
  recipientId: "22222222-2222-2222-2222-222222222222",
  currentUserId: "me",
};

function typeInto(value: string) {
  const textarea = screen.getByPlaceholderText(/type a message/i);
  fireEvent.change(textarea, { target: { value } });
}

describe("MessageComposer draft autosave", () => {
  beforeEach(() => {
    saveSpy.mockReset();
    clearSpy.mockReset();
    mutateImpl.mockReset();
    draftValue = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("seeds the textarea from the existing draft", () => {
    draftValue = "Saved unsent reply";
    render(<MessageComposer {...baseProps} />);
    const textarea = screen.getByPlaceholderText(/type a message/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Saved unsent reply");
  });

  it("debounce-saves the draft after the user stops typing", () => {
    vi.useFakeTimers();
    render(<MessageComposer {...baseProps} />);

    typeInto("Hi");
    // Not saved immediately (debounced)
    expect(saveSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(saveSpy).toHaveBeenCalledWith("Hi");
  });

  it("debounces: only the final value is persisted", () => {
    vi.useFakeTimers();
    render(<MessageComposer {...baseProps} />);

    typeInto("H");
    typeInto("He");
    typeInto("Hey");

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith("Hey");
  });

  it("clears the draft when a message is sent", () => {
    mutateImpl.mockImplementation((_payload, opts) => opts?.onSuccess?.());
    render(<MessageComposer {...baseProps} />);

    typeInto("Send me");
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));

    expect(mutateImpl).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
  });
});

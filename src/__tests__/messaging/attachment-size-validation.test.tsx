import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MessageComposer from "@/components/messaging/MessageComposer";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      send: vi.fn(),
    }),
  }),
}));

vi.mock("@/hooks/useMessages", () => ({
  useSendMessage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/services/smart-replies/smart-replies", () => ({
  getSuggestedReplies: () => [],
}));

// Mock sonner toast
const toastErrorFn = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorFn(...args),
  },
}));

function renderComposer() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MessageComposer
        conversationId="conv-1"
        recipientId="user-2"
        currentUserId="user-1"
      />
    </QueryClientProvider>,
  );
}

describe("MessageComposer attachment size validation", () => {
  it("rejects files larger than 2MB on selection and shows error toast", () => {
    renderComposer();
    toastErrorFn.mockClear();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    // Create a 3MB file
    const largeFile = new File(
      [new ArrayBuffer(3 * 1024 * 1024)],
      "large-survey.pdf",
      { type: "application/pdf" },
    );

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    // Should show error toast immediately on selection
    expect(toastErrorFn).toHaveBeenCalledWith(
      expect.stringMatching(/2\s*MB|too large/i),
    );
  });

  it("accepts files under 2MB without error", () => {
    renderComposer();
    toastErrorFn.mockClear();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Create a 1MB file
    const smallFile = new File(
      [new ArrayBuffer(1 * 1024 * 1024)],
      "small-photo.jpg",
      { type: "image/jpeg" },
    );

    fireEvent.change(fileInput, { target: { files: [smallFile] } });

    // Should NOT show error toast
    expect(toastErrorFn).not.toHaveBeenCalled();
  });
});

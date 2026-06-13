import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Message } from "@/types/messaging";

// MessageThread pulls in MessageComposer, which instantiates a Supabase client at
// module load. Stub it so importing MessageBubble stays isolated and side-effect free.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ channel: () => ({ send: vi.fn() }) }),
}));

import { MessageBubble } from "./MessageThread";

const baseMessage: Message = {
  id: "m1",
  conversation_id: "c1",
  sender_id: "u1",
  content: "Hello there",
  attachment_url: null,
  attachment_type: null,
  attachment_size_bytes: null,
  created_at: new Date("2026-06-13T10:00:00Z"),
  sender_name: "Jane Doe",
};

describe("MessageBubble", () => {
  it("renders the message content", () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("styles outgoing bubbles with the deep-green brand surface", () => {
    render(<MessageBubble message={baseMessage} isOwn />);
    const bubble = screen.getByText("Hello there").parentElement;
    expect(bubble?.className).toContain("bg-brand-primary");
    expect(bubble?.className).toContain("text-white");
  });

  it("styles incoming bubbles with the muted light-grey surface", () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    const bubble = screen.getByText("Hello there").parentElement;
    expect(bubble?.className).toContain("bg-muted");
    expect(bubble?.className).toContain("text-foreground");
  });
});

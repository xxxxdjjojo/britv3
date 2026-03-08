"use client";

/**
 * MessageComposer -- textarea with file attach support and Ctrl+Enter send.
 */

import { useRef, useState, useCallback } from "react";
import { useSendMessage } from "@/hooks/useMessages";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import AttachmentPreview from "@/components/messaging/AttachmentPreview";

const MAX_CHARS = 5000;

export default function MessageComposer(
  props: Readonly<{
    conversationId: string;
    recipientId: string;
    contextType?: string;
  }>,
) {
  const { conversationId, recipientId, contextType = "general" } = props;
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMutation = useSendMessage(conversationId);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed && !selectedFile) return;

    sendMutation.mutate(
      {
        content: trimmed || "(attachment)",
        recipient_id: recipientId,
        context_type: contextType,
      },
      {
        onSuccess: () => {
          setContent("");
          setSelectedFile(null);
        },
      },
    );
  }, [content, selectedFile, sendMutation, recipientId, contextType]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
      }
      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [],
  );

  const charCount = content.length;

  return (
    <div className="border-t bg-background p-3 space-y-2">
      {/* Attachment preview */}
      {selectedFile && (
        <AttachmentPreview
          file={selectedFile}
          onRemove={() => setSelectedFile(null)}
        />
      )}

      {/* Composer row */}
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0"
          title="Attach file"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            placeholder="Type a message... (Ctrl+Enter to send)"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            rows={1}
            className="pr-16 min-h-10 max-h-32 resize-none"
          />
          <span className="absolute right-2 bottom-1 text-[10px] text-muted-foreground">
            {charCount}/{MAX_CHARS}
          </span>
        </div>

        {/* Send button */}
        <Button
          size="sm"
          onClick={() => void handleSend()}
          disabled={
            sendMutation.isPending || (!content.trim() && !selectedFile)
          }
          className="shrink-0"
        >
          {sendMutation.isPending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}

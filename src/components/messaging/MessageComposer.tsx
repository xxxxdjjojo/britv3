"use client";

/**
 * MessageComposer -- textarea with file attach support and Ctrl+Enter send.
 */

import { useRef, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";
import { useSendMessage } from "@/hooks/useMessages";
import { createClient } from "@/lib/supabase/client";
import { uploadAttachment } from "@/services/messaging/attachment-service";
import { getSuggestedReplies } from "@/services/smart-replies/smart-replies";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import AttachmentPreview from "@/components/messaging/AttachmentPreview";

const MAX_CHARS = 5000;
const supabase = createClient();

export default function MessageComposer(
  props: Readonly<{
    conversationId: string;
    recipientId: string;
    contextType?: string;
    lastMessageContent?: string;
    currentUserId?: string;
  }>,
) {
  const { conversationId, recipientId, contextType = "general", lastMessageContent = "", currentUserId } = props;
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => (content === "" ? getSuggestedReplies(contextType, lastMessageContent) : []),
    [content, contextType, lastMessageContent],
  );

  const sendMutation = useSendMessage(conversationId);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed && !selectedFile) return;
    if (sendMutation.isPending || isUploading) return;

    let attachmentPayload: {
      message_id?: string;
      attachment_url?: string;
      attachment_type?: string;
      attachment_size_bytes?: number;
    } = {};

    if (selectedFile) {
      setIsUploading(true);
      try {
        const supabase = createClient();
        const messageId = crypto.randomUUID();
        const result = await uploadAttachment(supabase, selectedFile, conversationId, messageId);
        posthog.capture("attachment_uploaded", {
          file_type: result.type,
          file_size_bytes: result.sizeBytes,
        });
        attachmentPayload = {
          message_id: messageId,
          attachment_url: result.url,
          attachment_type: result.type,
          attachment_size_bytes: result.sizeBytes,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        toast.error(msg);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMutation.mutate(
      {
        content: trimmed || "(attachment)",
        recipient_id: recipientId,
        context_type: contextType,
        ...attachmentPayload,
      },
      {
        onSuccess: () => {
          setContent("");
          setSelectedFile(null);
        },
      },
    );
  }, [content, selectedFile, sendMutation, recipientId, contextType, conversationId, isUploading]);

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
    <div className="border-t border-border bg-surface p-3 space-y-2">
      {/* Attachment preview */}
      {selectedFile && (
        <AttachmentPreview
          file={selectedFile}
          onRemove={() => setSelectedFile(null)}
        />
      )}

      {/* Smart reply chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-xs border"
              onClick={() => setContent(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
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
            onChange={(e) => {
              setContent(e.target.value.slice(0, MAX_CHARS));
              void supabase.channel(`typing:${conversationId}`).send({
                type: "broadcast",
                event: "typing",
                payload: { user_id: currentUserId ?? "", is_typing: true },
              });
            }}
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
            sendMutation.isPending || isUploading || (!content.trim() && !selectedFile)
          }
          className="shrink-0 bg-brand-primary text-white hover:bg-brand-primary-dark"
        >
          {isUploading ? "Uploading..." : sendMutation.isPending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}

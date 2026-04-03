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
    <div className="px-8 pb-6 pt-0 space-y-2 min-h-0 flex flex-col">
      {/* Attachment preview */}
      {selectedFile && (
        <AttachmentPreview
          file={selectedFile}
          onRemove={() => setSelectedFile(null)}
        />
      )}

      {/* Smart reply chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-lg border border-outline-variant/20 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:text-brand-primary hover:border-brand-primary/30 transition-colors"
              onClick={() => setContent(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Composer row */}
      <div className="bg-surface-container-low rounded-2xl p-4 flex items-end gap-4 border border-transparent focus-within:bg-surface-container-lowest focus-within:border-outline-variant/20 transition-all shrink-0">
        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 p-2 text-outline hover:text-brand-primary transition-colors"
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
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Message input */}
        <div className="flex-1">
          <Textarea
            placeholder="Type your message..."
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
            className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 resize-none placeholder:text-outline/50 min-h-10 max-h-32"
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={
            sendMutation.isPending || isUploading || (!content.trim() && !selectedFile)
          }
          className="px-6 py-2.5 bg-brand-primary text-white rounded-lg font-heading text-xs font-bold tracking-widest uppercase hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {isUploading ? "..." : sendMutation.isPending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

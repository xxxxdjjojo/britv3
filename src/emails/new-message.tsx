import { Section, Text } from "@react-email/components";
import type { NewMessageEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function NewMessageEmail({
  recipientFirstName,
  senderName,
  messagePreview,
  conversationUrl,
}: Readonly<NewMessageEmailProps>) {
  return (
    <EmailWrapper previewText={`${senderName} sent you a message`}>
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#1B4D3E",
            margin: "0 0 16px 0",
            lineHeight: "1.3",
          }}
        >
          New Message
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {recipientFirstName}, you&apos;ve received a new message from{" "}
          <strong style={{ color: "#0A0A0B" }}>{senderName}</strong>.
        </Text>

        <div
          style={{
            border: "1px solid #E2E2E8",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            backgroundColor: "#F8F8FA",
            borderLeft: "4px solid #1B4D3E",
          }}
        >
          <Text
            style={{
              fontSize: "12px",
              color: "#9E9EAB",
              margin: "0 0 8px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {senderName}
          </Text>
          <Text
            style={{
              fontSize: "15px",
              color: "#0A0A0B",
              margin: "0",
              lineHeight: "1.5",
              fontStyle: "italic",
            }}
          >
            &ldquo;{messagePreview}&rdquo;
          </Text>
        </div>

        <EmailButton href={conversationUrl} variant="primary">
          Reply in your inbox
        </EmailButton>

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "24px 0 0 0",
            lineHeight: "1.5",
          }}
        >
          For your security, always keep conversations and payments on the
          platform. We&apos;ll never ask you to move off-platform to complete a
          transaction.
        </Text>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}

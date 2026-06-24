import { Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";
import { brandConfig } from "@/config/brand";

type Props = Readonly<{
  position: number;
  shareUrl: string;
}>;

export function WaitlistWelcomeEmail({ position, shareUrl }: Props) {
  const brandName = brandConfig.displayName;

  return (
    <EmailWrapper previewText={`You're #${position} on the ${brandName} early-access list`}>
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1B4D3E",
            margin: "0 0 12px 0",
            lineHeight: "1.3",
          }}
        >
          You&apos;re on the list
        </Text>
        <Text
          style={{
            fontSize: "16px",
            color: "#5E5E6A",
            margin: "0 0 32px 0",
            lineHeight: "1.6",
          }}
        >
          Thanks for joining the {brandName} early-access list. We&apos;ll email you
          the moment your spot opens up.
        </Text>

        <div
          style={{
            backgroundColor: "#003629",
            borderRadius: "12px",
            padding: "32px 24px",
            textAlign: "center",
            margin: "0 0 32px 0",
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#FDCD74",
              margin: "0 0 8px 0",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Your position in the queue
          </Text>
          <Text
            style={{
              fontSize: "48px",
              fontWeight: "800",
              color: "#FFFFFF",
              margin: "0",
              lineHeight: "1",
            }}
          >
            #{position.toLocaleString("en-GB")}
          </Text>
        </div>

        <Text
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#0A0A0B",
            margin: "0 0 8px 0",
            lineHeight: "1.4",
          }}
        >
          Want in sooner?
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#5E5E6A",
            margin: "0 0 20px 0",
            lineHeight: "1.6",
          }}
        >
          Every friend who joins with your link moves you further up the queue.
          Share it and skip ahead.
        </Text>

        <EmailButton href={shareUrl} variant="primary">
          Share &amp; move up
        </EmailButton>

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "16px 0 0 0",
            wordBreak: "break-all",
          }}
        >
          {shareUrl}
        </Text>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}

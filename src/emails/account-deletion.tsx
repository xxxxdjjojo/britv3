import { Section, Text, Link } from "@react-email/components";
import type { AccountDeletionEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";

export function AccountDeletionEmail({
  firstName,
  deletedAt,
  dataRetentionDays,
  supportUrl,
}: Readonly<AccountDeletionEmailProps>) {
  const formattedDate = new Date(deletedAt).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <EmailWrapper previewText="Your Britestate account has been deleted">
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
          Account Deletion Confirmed
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 20px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, your Britestate account has been successfully deleted on{" "}
          <strong style={{ color: "#0A0A0B" }}>{formattedDate}</strong>.
        </Text>

        <div
          style={{
            backgroundColor: "#F8F8FA",
            border: "1px solid #E2E2E8",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <Text
            style={{
              fontSize: "14px",
              color: "#5E5E6A",
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            Your personal data will be retained for{" "}
            <strong style={{ color: "#0A0A0B" }}>{dataRetentionDays} days</strong> in accordance
            with our data retention policy, after which it will be permanently deleted.
          </Text>
        </div>

        {supportUrl && (
          <Text
            style={{
              fontSize: "14px",
              color: "#5E5E6A",
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            If you deleted your account by mistake or need help,{" "}
            <Link
              href={supportUrl}
              style={{
                color: "#2563EB",
                textDecoration: "none",
              }}
            >
              contact support
            </Link>
            .
          </Text>
        )}
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}

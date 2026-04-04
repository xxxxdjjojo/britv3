import { Section, Text, Link } from "@react-email/components";
import type { AccountDeletionEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import {
  BRAND_PRIMARY,
  BRAND_ACCENT,
  NEUTRAL_950,
  NEUTRAL_600,
  NEUTRAL_200,
  NEUTRAL_50,
} from "@/emails/_constants/colors";

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
            color: BRAND_PRIMARY,
            margin: "0 0 16px 0",
            lineHeight: "1.3",
          }}
        >
          Account Deletion Confirmed
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 20px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, your Britestate account has been successfully deleted on{" "}
          <strong style={{ color: NEUTRAL_950 }}>{formattedDate}</strong>.
        </Text>

        <div
          style={{
            backgroundColor: NEUTRAL_50,
            border: `1px solid ${NEUTRAL_200}`,
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <Text
            style={{
              fontSize: "14px",
              color: NEUTRAL_600,
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            Your personal data will be retained for{" "}
            <strong style={{ color: NEUTRAL_950 }}>{dataRetentionDays} days</strong> in accordance
            with our data retention policy, after which it will be permanently deleted.
          </Text>
        </div>

        {supportUrl && (
          <Text
            style={{
              fontSize: "14px",
              color: NEUTRAL_600,
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            If you deleted your account by mistake or need help,{" "}
            <Link
              href={supportUrl}
              style={{
                color: BRAND_ACCENT,
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

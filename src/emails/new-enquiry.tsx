import { Section, Text, Link } from "@react-email/components";
import type { NewEnquiryEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function NewEnquiryEmail({
  providerFirstName,
  enquirerName,
  enquirerEmail,
  enquirerPhone,
  serviceType,
  message,
  dashboardUrl,
}: Readonly<NewEnquiryEmailProps>) {
  return (
    <EmailWrapper previewText="You have a new enquiry">
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
          New Enquiry Received
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {providerFirstName}, you&apos;ve received a new enquiry for{" "}
          <strong style={{ color: "#0A0A0B" }}>{serviceType}</strong>.
        </Text>

        <div
          style={{
            border: "1px solid #E2E2E8",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            backgroundColor: "#F8F8FA",
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#9E9EAB",
              margin: "0 0 16px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Enquirer Details
          </Text>

          <div style={{ marginBottom: "12px" }}>
            <Text
              style={{
                fontSize: "12px",
                color: "#9E9EAB",
                margin: "0 0 2px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Name
            </Text>
            <Text
              style={{
                fontSize: "15px",
                color: "#0A0A0B",
                fontWeight: "500",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {enquirerName}
            </Text>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <Text
              style={{
                fontSize: "12px",
                color: "#9E9EAB",
                margin: "0 0 2px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Email
            </Text>
            <Link
              href={`mailto:${enquirerEmail}`}
              style={{
                fontSize: "15px",
                color: "#2563EB",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              {enquirerEmail}
            </Link>
          </div>

          {enquirerPhone && (
            <div style={{ marginBottom: "16px" }}>
              <Text
                style={{
                  fontSize: "12px",
                  color: "#9E9EAB",
                  margin: "0 0 2px 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Phone
              </Text>
              <Text
                style={{
                  fontSize: "15px",
                  color: "#0A0A0B",
                  fontWeight: "500",
                  margin: "0",
                  lineHeight: "1.4",
                }}
              >
                {enquirerPhone}
              </Text>
            </div>
          )}

          <div>
            <Text
              style={{
                fontSize: "12px",
                color: "#9E9EAB",
                margin: "0 0 8px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Message
            </Text>
            <div
              style={{
                border: "1px solid #E2E2E8",
                borderRadius: "8px",
                padding: "12px 16px",
                backgroundColor: "#FFFFFF",
              }}
            >
              <Text
                style={{
                  fontSize: "14px",
                  color: "#0A0A0B",
                  margin: "0",
                  lineHeight: "1.6",
                }}
              >
                {message}
              </Text>
            </div>
          </div>
        </div>

        <EmailButton href={dashboardUrl} variant="primary">
          View in Dashboard
        </EmailButton>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}

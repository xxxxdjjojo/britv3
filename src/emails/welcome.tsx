import { Section, Text } from "@react-email/components";
import type { WelcomeEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

const steps = [
  {
    number: "1",
    title: "Complete Profile",
    description: "Add your details for personalised results",
  },
  {
    number: "2",
    title: "Set Preferences",
    description: "Filter by location, price, and property type",
  },
  {
    number: "3",
    title: "Start Exploring",
    description: "Browse listings and schedule viewings",
  },
];

export function WelcomeEmail({ firstName, loginUrl }: Readonly<WelcomeEmailProps>) {
  const ctaUrl = loginUrl ?? "https://britestate.co.uk/dashboard";

  return (
    <EmailWrapper previewText={`Welcome to Britestate, ${firstName}!`}>
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
          Welcome to Britestate, {firstName}!
        </Text>
        <Text
          style={{
            fontSize: "16px",
            color: "#5E5E6A",
            margin: "0 0 32px 0",
            lineHeight: "1.6",
          }}
        >
          We&apos;re delighted to have you join the UK&apos;s most trusted property portal.
        </Text>

        <Text
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#0A0A0B",
            margin: "0 0 16px 0",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Get started in 3 easy steps
        </Text>

        {steps.map((step) => (
          <div
            key={step.number}
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginBottom: "16px",
              padding: "16px",
              backgroundColor: "#F8F8FA",
              borderRadius: "8px",
              border: "1px solid #E2E2E8",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#1B4D3E",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginRight: "16px",
                lineHeight: "32px",
                textAlign: "center",
              }}
            >
              {step.number}
            </div>
            <div>
              <Text
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#0A0A0B",
                  margin: "0 0 4px 0",
                  lineHeight: "1.4",
                }}
              >
                {step.title}
              </Text>
              <Text
                style={{
                  fontSize: "13px",
                  color: "#5E5E6A",
                  margin: "0",
                  lineHeight: "1.5",
                }}
              >
                {step.description}
              </Text>
            </div>
          </div>
        ))}

        <div style={{ marginTop: "24px" }}>
          <EmailButton href={ctaUrl} variant="primary">
            Complete Your Profile
          </EmailButton>
        </div>

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "16px 0 0 0",
            textAlign: "center",
          }}
        >
          Takes less than 2 minutes to complete
        </Text>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}

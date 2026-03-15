import { Hr, Section, Text, Link } from "@react-email/components";

type Props = Readonly<{ unsubscribeUrl: string; userId?: string }>;

export function EmailFooter({ unsubscribeUrl }: Props) {
  return (
    <>
      <Hr
        style={{
          borderColor: "#E2E2E8",
          margin: "0",
        }}
      />
      <Section
        style={{
          padding: "24px 32px",
          backgroundColor: "#F8F8FA",
        }}
      >
        <Text
          style={{
            color: "#9E9EAB",
            fontSize: "12px",
            margin: "0 0 12px 0",
            lineHeight: "1.5",
          }}
        >
          Britestate Ltd, 123 Property Lane, London, EC1A 1BB
        </Text>
        <Text
          style={{
            color: "#5E5E6A",
            fontSize: "12px",
            margin: "0 0 12px 0",
            lineHeight: "1.5",
          }}
        >
          <Link
            href="https://britestate.co.uk/privacy"
            style={{
              color: "#5E5E6A",
              fontSize: "12px",
              textDecoration: "none",
            }}
          >
            Privacy Policy
          </Link>
          {" | "}
          <Link
            href="https://britestate.co.uk/terms"
            style={{
              color: "#5E5E6A",
              fontSize: "12px",
              textDecoration: "none",
            }}
          >
            Terms
          </Link>
          {" | "}
          <Link
            href={unsubscribeUrl}
            style={{
              color: "#5E5E6A",
              fontSize: "12px",
              textDecoration: "none",
            }}
          >
            Unsubscribe
          </Link>
        </Text>
        <Text
          style={{
            color: "#9E9EAB",
            fontSize: "11px",
            margin: "0",
            lineHeight: "1.5",
          }}
        >
          &copy; 2026 Britestate Ltd. All rights reserved.
        </Text>
      </Section>
    </>
  );
}

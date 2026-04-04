import { Html, Head, Body, Container } from "@react-email/components";
import { NEUTRAL_50 } from "@/emails/_constants/colors";

type Props = Readonly<{ children: React.ReactNode; previewText?: string }>;

export function EmailWrapper({ children, previewText }: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Body
        style={{
          backgroundColor: NEUTRAL_50,
          fontFamily: "Inter, ui-sans-serif, system-ui",
          margin: "0",
          padding: "40px 0",
        }}
      >
        {previewText && (
          <span
            style={{
              display: "none",
              maxHeight: "0px",
              overflow: "hidden",
            }}
          >
            {previewText}
          </span>
        )}
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}

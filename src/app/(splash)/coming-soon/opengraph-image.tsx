import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TrueDeed — Coming Soon";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #04130C 0%, #003629 60%, #1B4D3E 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#ffffff",
          }}
        >
          TrueDeed
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 940,
            }}
          >
            The way Britain finds home is about to change
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              color: "#FDCD74",
            }}
          >
            Early access opening soon
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

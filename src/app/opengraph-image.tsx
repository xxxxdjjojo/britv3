import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Britestate — UK Property Portal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#1B4D3E" /* brand-primary */, color: "white", fontSize: 60, fontWeight: 700 }}>
        <div>Britestate</div>
        <div style={{ fontSize: 28, marginTop: 16, opacity: 0.8 }}>UK Property Portal</div>
      </div>
    ),
    { ...size },
  );
}

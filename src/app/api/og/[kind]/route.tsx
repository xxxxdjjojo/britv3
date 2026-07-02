import { ImageResponse } from "next/og";
import { brandConfig } from "@/config/brand";
import { buildOgProps, type OgProps, type PostcodeOgProps } from "@/lib/og/og-props";

// Note: unlike src/app/opengraph-image.tsx (edge), this route handler uses the
// default Node.js runtime — ImageResponse works on both, and nodejs avoids the
// edge bundle constraints for parameterised routes.

const WIDTH = 1200;
const HEIGHT = 630;

const BRAND_GREEN = "#1B4D3E";
const ACCENT_GREEN = "#7FB89F";

const KICKERS: Record<OgProps["kind"], string> = {
  postcode: "TrueDeed market data",
  pledge: "TrueDeed pledge",
  briefing: "Independent Agent Briefing",
  tool: "TrueDeed tools",
};

function headlineFor(props: OgProps): string {
  if (props.kind === "postcode") return `Median sold price in ${props.postcode}`;
  return props.title;
}

function subFor(props: OgProps): string | undefined {
  switch (props.kind) {
    case "postcode":
      return props.area;
    case "briefing":
      return props.edition;
    case "tool":
      return props.subtitle;
    default:
      return undefined;
  }
}

function footerFor(props: OgProps): string {
  if (props.kind === "postcode") {
    return `Source: HM Land Registry price paid data · ${brandConfig.canonicalDomain}`;
  }
  return brandConfig.canonicalDomain;
}

function MedianFigure({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginRight: 80 }}>
      <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: ACCENT_GREEN, textTransform: "uppercase", letterSpacing: 2 }}>
        {label}
      </div>
      <div style={{ display: "flex", fontSize: 54, fontWeight: 700, marginTop: 8 }}>{value}</div>
    </div>
  );
}

function MedianRow({ props }: Readonly<{ props: PostcodeOgProps }>) {
  if (!props.flatMedian && !props.houseMedian) return null;
  return (
    <div style={{ display: "flex", flexDirection: "row", marginTop: 40 }}>
      {props.flatMedian ? <MedianFigure label="Flat" value={props.flatMedian} /> : null}
      {props.houseMedian ? <MedianFigure label="House" value={props.houseMedian} /> : null}
    </div>
  );
}

function OgCard({ props }: Readonly<{ props: OgProps }>) {
  const sub = subFor(props);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        backgroundColor: BRAND_GREEN,
        color: "white",
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 28,
          fontWeight: 600,
          color: ACCENT_GREEN,
          textTransform: "uppercase",
          letterSpacing: 4,
        }}
      >
        {KICKERS[props.kind]}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", width: 120, height: 10, backgroundColor: ACCENT_GREEN, borderRadius: 5, marginBottom: 32 }} />
        <div style={{ display: "flex", fontSize: 62, fontWeight: 700, lineHeight: 1.1 }}>
          {headlineFor(props)}
        </div>
        {sub ? (
          <div style={{ display: "flex", fontSize: 32, marginTop: 20, opacity: 0.85 }}>{sub}</div>
        ) : null}
        {props.kind === "postcode" ? <MedianRow props={props} /> : null}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>{brandConfig.displayName}</div>
        <div style={{ display: "flex", fontSize: 22, opacity: 0.75 }}>{footerFor(props)}</div>
      </div>
    </div>
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params;
  const props = buildOgProps(kind, new URL(request.url).searchParams);

  if (!props) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(<OgCard props={props} />, {
    width: WIDTH,
    height: HEIGHT,
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

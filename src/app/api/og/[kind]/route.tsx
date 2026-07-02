import { ImageResponse } from "next/og";
import { brandConfig } from "@/config/brand";
import { createRateLimiter } from "@/lib/cache/redis";
import { buildOgProps, type OgProps, type PostcodeOgProps, type ReportOgProps } from "@/lib/og/og-props";

// ImageResponse rendering is CPU-heavy and the valid-parameter space is large
// (every postcode/title is a distinct CDN cache key), so cap per-IP generation.
// 60/min still covers every legitimate social-share crawler burst.
const ogLimiter = createRateLimiter(60, "1 m");

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
  league: "Postcode Truth League",
  report: "TrueDeed reports",
};

function headlineFor(props: OgProps): string {
  if (props.kind === "postcode") return `Median sold price in ${props.postcode}`;
  if (props.kind === "league") return `How honest are asking prices in ${props.area}?`;
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
    case "league": {
      const parts: string[] = [];
      if (props.rank) parts.push(`#${props.rank} of UK districts`);
      if (props.gapPct) parts.push(`asking vs sold gap: ${props.gapPct}`);
      return parts.length > 0 ? parts.join(" · ") : undefined;
    }
    case "report":
      return props.edition;
    default:
      return undefined;
  }
}

function footerFor(props: OgProps): string {
  if (props.kind === "postcode" || props.kind === "league") {
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

function ReportStat({ props }: Readonly<{ props: ReportOgProps }>) {
  if (!props.stat) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
      <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>{props.stat}</div>
      {props.statLabel ? (
        <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: ACCENT_GREEN, textTransform: "uppercase", letterSpacing: 2, marginTop: 8 }}>
          {props.statLabel}
        </div>
      ) : null}
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
        {props.kind === "report" ? <ReportStat props={props} /> : null}
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

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await ogLimiter.limit(`og:${ip}`);
  if (!rl.success) {
    return new Response("Rate limited", { status: 429 });
  }

  return new ImageResponse(<OgCard props={props} />, {
    width: WIDTH,
    height: HEIGHT,
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

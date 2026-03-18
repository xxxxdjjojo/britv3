import { ImageResponse } from "next/og";

export const runtime = "edge";

/** Only allow images from trusted origins to prevent SSRF. */
const ALLOWED_IMAGE_HOSTS = new Set([
  "ynkqzzpcbpphjczmrfva.supabase.co",
  "cdn.britestate.co.uk",
  "britestate.co.uk",
]);

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function BrandHeader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: "72px",
        padding: "0 48px",
        backgroundColor: "#1B4D3E",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "28px",
          fontWeight: 700,
          color: "#FFFFFF",
          letterSpacing: "-0.02em",
        }}
      >
        Britestate
      </div>
      <div
        style={{
          display: "flex",
          fontSize: "16px",
          color: "#D4A853",
          fontWeight: 500,
        }}
      >
        UK Property Portal
      </div>
    </div>
  );
}

function FallbackCard() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#F8FAF9",
      }}
    >
      <BrandHeader />
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "48px",
            fontWeight: 700,
            color: "#1B4D3E",
          }}
        >
          Britestate
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "24px",
            color: "#6B7280",
          }}
        >
          Your all-in-one UK property portal
        </div>
      </div>
    </div>
  );
}

function TypeBadge(props: Readonly<{ type: string }>) {
  const labels: Record<string, string> = {
    property: "Property Listing",
    agent: "Estate Agent",
    page: "",
  };
  const label = labels[props.type] ?? "";
  if (!label) return null;
  return (
    <div
      style={{
        display: "flex",
        fontSize: "14px",
        fontWeight: 600,
        color: "#FFFFFF",
        backgroundColor: "#2D7A5F",
        padding: "4px 16px",
        borderRadius: "4px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </div>
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title");
    const description = searchParams.get("description");
    const rawImage = searchParams.get("image");
    const image = rawImage && isAllowedImageUrl(rawImage) ? rawImage : null;
    const type = searchParams.get("type") ?? "page";

    // If no title, return branded fallback
    if (!title) {
      return new ImageResponse(<FallbackCard />, {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=2678400, immutable",
        },
      });
    }

    // With image: split layout (60/40)
    if (image) {
      return new ImageResponse(
        (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              backgroundColor: "#FFFFFF",
            }}
          >
            <BrandHeader />
            <div
              style={{
                display: "flex",
                flex: 1,
                width: "100%",
              }}
            >
              {/* Text side */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  width: "60%",
                  padding: "40px 48px",
                  gap: "16px",
                }}
              >
                <TypeBadge type={type} />
                <div
                  style={{
                    display: "flex",
                    fontSize: "40px",
                    fontWeight: 700,
                    color: "#111827",
                    lineHeight: 1.2,
                    overflow: "hidden",
                  }}
                >
                  {title.length > 80 ? `${title.slice(0, 77)}...` : title}
                </div>
                {description ? (
                  <div
                    style={{
                      display: "flex",
                      fontSize: "20px",
                      color: "#6B7280",
                      lineHeight: 1.4,
                      overflow: "hidden",
                    }}
                  >
                    {description.length > 120
                      ? `${description.slice(0, 117)}...`
                      : description}
                  </div>
                ) : null}
              </div>
              {/* Image side */}
              <div
                style={{
                  display: "flex",
                  width: "40%",
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  width={480}
                  height={558}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
          headers: {
            "Cache-Control": "public, max-age=2678400, immutable",
          },
        },
      );
    }

    // No image: full-width text with gradient background
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            backgroundColor: "#FFFFFF",
          }}
        >
          <BrandHeader />
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "center",
              padding: "48px 64px",
              gap: "20px",
              background:
                "linear-gradient(135deg, #F8FAF9 0%, #E8F0EC 50%, #F0F4F2 100%)",
            }}
          >
            <TypeBadge type={type} />
            <div
              style={{
                display: "flex",
                fontSize: "52px",
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1.2,
                overflow: "hidden",
              }}
            >
              {title.length > 80 ? `${title.slice(0, 77)}...` : title}
            </div>
            {description ? (
              <div
                style={{
                  display: "flex",
                  fontSize: "24px",
                  color: "#6B7280",
                  lineHeight: 1.4,
                  overflow: "hidden",
                }}
              >
                {description.length > 150
                  ? `${description.slice(0, 147)}...`
                  : description}
              </div>
            ) : null}
          </div>
          {/* Bottom accent bar */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "6px",
              background:
                "linear-gradient(90deg, #1B4D3E 0%, #2D7A5F 50%, #D4A853 100%)",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=2678400, immutable",
        },
      },
    );
  } catch {
    // On any error, return a branded fallback
    return new ImageResponse(<FallbackCard />, {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=2678400, immutable",
      },
    });
  }
}

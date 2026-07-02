const MAX_TEXT_LENGTH = 120;
const MAX_MEDIAN_VALUE = 1_000_000_000;

// Outward code required (e.g. "W5"), inward code optional (e.g. "M1 1AE").
const UK_POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?(?: ?\d[A-Z]{2})?$/;

export type PostcodeOgProps = {
  kind: "postcode";
  postcode: string;
  area?: string;
  flatMedian?: string;
  houseMedian?: string;
};

export type PledgeOgProps = {
  kind: "pledge";
  title: string;
};

export type BriefingOgProps = {
  kind: "briefing";
  title: string;
  edition?: string;
};

export type ToolOgProps = {
  kind: "tool";
  title: string;
  subtitle?: string;
};

export type OgProps = PostcodeOgProps | PledgeOgProps | BriefingOgProps | ToolOgProps;

function sanitiseText(value: string | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, MAX_TEXT_LENGTH);
}

function parsePostcode(value: string | null): string | undefined {
  const cleaned = sanitiseText(value);
  if (!cleaned) return undefined;
  const normalised = cleaned.toUpperCase().replace(/\s+/g, " ");
  return UK_POSTCODE_PATTERN.test(normalised) ? normalised : undefined;
}

function formatPounds(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || !/^\d+(?:\.\d+)?$/.test(trimmed)) return undefined;
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric > MAX_MEDIAN_VALUE) return undefined;
  return `£${Math.round(numeric).toLocaleString("en-GB")}`;
}

export function buildOgProps(kind: string, searchParams: URLSearchParams): OgProps | null {
  switch (kind) {
    case "postcode": {
      const postcode = parsePostcode(searchParams.get("postcode"));
      if (!postcode) return null;
      return {
        kind: "postcode",
        postcode,
        area: sanitiseText(searchParams.get("area")),
        flatMedian: formatPounds(searchParams.get("flatMedian")),
        houseMedian: formatPounds(searchParams.get("houseMedian")),
      };
    }
    case "pledge": {
      const title = sanitiseText(searchParams.get("title"));
      if (!title) return null;
      return { kind: "pledge", title };
    }
    case "briefing": {
      const title = sanitiseText(searchParams.get("title"));
      if (!title) return null;
      return {
        kind: "briefing",
        title,
        edition: sanitiseText(searchParams.get("edition")),
      };
    }
    case "tool": {
      const title = sanitiseText(searchParams.get("title"));
      if (!title) return null;
      return {
        kind: "tool",
        title,
        subtitle: sanitiseText(searchParams.get("subtitle")),
      };
    }
    default:
      return null;
  }
}

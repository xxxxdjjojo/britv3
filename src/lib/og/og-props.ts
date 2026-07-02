const MAX_TEXT_LENGTH = 120;
const MAX_AREA_LENGTH = 80;
const MAX_STAT_LENGTH = 40;
const MAX_MEDIAN_VALUE = 1_000_000_000;
const MIN_GAP_PCT = -100;
const MAX_GAP_PCT = 1000;

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

export type LeagueOgProps = {
  kind: "league";
  area: string;
  rank?: string;
  gapPct?: string;
};

export type ReportOgProps = {
  kind: "report";
  title: string;
  stat?: string;
  statLabel?: string;
  edition?: string;
};

export type OgProps =
  | PostcodeOgProps
  | PledgeOgProps
  | BriefingOgProps
  | ToolOgProps
  | LeagueOgProps
  | ReportOgProps;

function sanitiseText(value: string | null, maxLength: number = MAX_TEXT_LENGTH): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, maxLength);
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

function parseRank(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  // Positive integer, at most 4 digits.
  if (!/^\d{1,4}$/.test(trimmed)) return undefined;
  const numeric = Number(trimmed);
  if (numeric < 1) return undefined;
  return String(numeric);
}

function formatGapPct(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || !/^-?\d+(?:\.\d+)?$/.test(trimmed)) return undefined;
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric < MIN_GAP_PCT || numeric > MAX_GAP_PCT) return undefined;
  const sign = numeric < 0 ? "−" : "+";
  return `${sign}${Math.abs(numeric).toFixed(1)}%`;
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
    case "league": {
      const area = sanitiseText(searchParams.get("area"), MAX_AREA_LENGTH);
      if (!area) return null;
      return {
        kind: "league",
        area,
        rank: parseRank(searchParams.get("rank")),
        gapPct: formatGapPct(searchParams.get("gapPct")),
      };
    }
    case "report": {
      const title = sanitiseText(searchParams.get("title"));
      if (!title) return null;
      return {
        kind: "report",
        title,
        stat: sanitiseText(searchParams.get("stat"), MAX_STAT_LENGTH),
        statLabel: sanitiseText(searchParams.get("statLabel"), MAX_AREA_LENGTH),
        edition: sanitiseText(searchParams.get("edition"), MAX_STAT_LENGTH),
      };
    }
    default:
      return null;
  }
}

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TextDecoder } from "node:util";

export type FindingKind = "content" | "filename" | "unknown-binary";

export type LegacyBrandFinding = {
  kind: FindingKind;
  path: string;
  line: number;
  match?: string;
  message: string;
};

export type ScanOptions = {
  rootDir: string;
  trackedFiles?: string[];
  allowlistPatterns?: string[];
  allowlistPath?: string;
};

export type ScanResult = {
  findings: LegacyBrandFinding[];
  scannedFiles: number;
  skippedFiles: number;
};

const LEGACY_BRAND_RE = /britestate/gi;
const DEFAULT_ALLOWLIST_PATH = "docs/TRUEDEED_LEGACY_BRAND_ALLOWLIST.md";
const ALLOWLIST_START = "<!-- TRUEDEED_LEGACY_ALLOWLIST_START -->";
const ALLOWLIST_END = "<!-- TRUEDEED_LEGACY_ALLOWLIST_END -->";

const EXCLUDED_PREFIXES = [
  ".cache/",
  ".git/",
  ".next/",
  ".turbo/",
  ".gstack/qa-reports/",
  "build/",
  "coverage/",
  "dist/",
  "node_modules/",
  "out/",
  "playwright-report/",
  "test-results/",
];

const KNOWN_BINARY_EXTENSIONS = new Set([
  ".avif",
  ".br",
  ".db",
  ".gif",
  ".gz",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp4",
  ".otf",
  ".pdf",
  ".png",
  ".sqlite",
  ".ttf",
  ".wasm",
  ".webp",
  ".woff",
  ".woff2",
  ".zip",
]);

const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

export async function scanLegacyBrandReferences(options: ScanOptions): Promise<ScanResult> {
  const rootDir = resolve(options.rootDir);
  const allowlistPatterns = [
    ...readAllowlistFile(options.allowlistPath ? resolve(rootDir, options.allowlistPath) : resolve(rootDir, DEFAULT_ALLOWLIST_PATH)),
    ...(options.allowlistPatterns ?? []),
  ];
  const allowlistMatchers = allowlistPatterns.map(createPathMatcher);
  const trackedFiles = options.trackedFiles ?? listTrackedFiles(rootDir);
  const findings: LegacyBrandFinding[] = [];
  let scannedFiles = 0;
  let skippedFiles = 0;

  for (const file of trackedFiles.map(normalizePath).sort()) {
    if (shouldExclude(file) || isAllowlisted(file, allowlistMatchers)) {
      skippedFiles += 1;
      continue;
    }

    const filenameMatch = file.match(LEGACY_BRAND_RE)?.[0];
    if (filenameMatch) {
      findings.push({
        kind: "filename",
        path: file,
        line: 1,
        match: filenameMatch,
        message: `legacy brand in filename: ${filenameMatch}`,
      });
    }

    if (KNOWN_BINARY_EXTENSIONS.has(extname(file).toLowerCase())) {
      skippedFiles += 1;
      continue;
    }

    const absolutePath = resolve(rootDir, file);
    const buffer = readFileSync(absolutePath);
    const text = decodeUtf8(buffer);

    if (text === null) {
      findings.push({
        kind: "unknown-binary",
        path: file,
        line: 1,
        message: "unknown binary file was not scanned; add a known binary extension or an explicit allowlist entry",
      });
      continue;
    }

    scannedFiles += 1;
    findings.push(...findContentMatches(file, text));
  }

  return { findings, scannedFiles, skippedFiles };
}

export function formatFindings(findings: LegacyBrandFinding[]): string {
  return findings.map((finding) => `${finding.path}:${finding.line} ${finding.message}`).join("\n");
}

function listTrackedFiles(rootDir: string): string[] {
  const output = execFileSync("git", ["-C", rootDir, "ls-files", "-z"], { encoding: "buffer" });
  return output.toString("utf8").split("\0").filter(Boolean);
}

function readAllowlistFile(allowlistPath: string): string[] {
  if (!existsSync(allowlistPath)) return [];

  const source = readFileSync(allowlistPath, "utf8");
  const start = source.indexOf(ALLOWLIST_START);
  const end = source.indexOf(ALLOWLIST_END);
  const body = start === -1 || end === -1 ? source : source.slice(start + ALLOWLIST_START.length, end);

  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("<!--") && !line.startsWith("```"))
    .map((line) => line.replace(/^-\s*/, ""))
    .map((line) => line.replace(/\s+#.*$/, ""))
    .filter(Boolean)
    .map(normalizePath);
}

// Test files (unit, e2e, db) legitimately reference the legacy brand — they are
// brand-regression guards that assert the string is *absent* from production
// surfaces, so they must contain it. Never flag them.
const TEST_FILE_RE = /(\.(test|spec)\.[cm]?[jt]sx?$|(^|\/)(__tests__|db-tests|e2e)\/)/;

function shouldExclude(file: string): boolean {
  if (TEST_FILE_RE.test(file)) return true;
  return EXCLUDED_PREFIXES.some((prefix) => file === prefix.slice(0, -1) || file.startsWith(prefix));
}

function isAllowlisted(file: string, matchers: Array<(path: string) => boolean>): boolean {
  return matchers.some((matches) => matches(file));
}

function createPathMatcher(pattern: string): (path: string) => boolean {
  const normalizedPattern = normalizePath(pattern).replace(/^\/+/, "");

  if (normalizedPattern.endsWith("/")) {
    return (path) => path.startsWith(normalizedPattern);
  }

  if (!normalizedPattern.includes("*")) {
    return (path) => path === normalizedPattern;
  }

  const regex = new RegExp(`^${globToRegExp(normalizedPattern)}$`);
  return (path) => regex.test(path);
}

function globToRegExp(pattern: string): string {
  let source = "";

  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    const next = pattern[index + 1];

    if (char === "*" && next === "*") {
      source += ".*";
      index += 1;
      continue;
    }

    if (char === "*") {
      source += "[^/]*";
      continue;
    }

    source += escapeRegExp(char);
  }

  return source;
}

function escapeRegExp(char: string): string {
  return /[\\^$+?.()|[\]{}]/.test(char) ? `\\${char}` : char;
}

function decodeUtf8(buffer: Buffer): string | null {
  if (buffer.includes(0)) return null;

  try {
    return utf8Decoder.decode(buffer);
  } catch {
    return null;
  }
}

function findContentMatches(file: string, text: string): LegacyBrandFinding[] {
  const findings: LegacyBrandFinding[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const matches = line.match(LEGACY_BRAND_RE);
    if (!matches) return;

    for (const match of matches) {
      findings.push({
        kind: "content",
        path: file,
        line: index + 1,
        match,
        message: `legacy brand content: ${match}`,
      });
    }
  });

  return findings;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

async function runCli(): Promise<void> {
  const args = process.argv.slice(2);
  let rootDir = process.cwd();
  let allowlistPath = DEFAULT_ALLOWLIST_PATH;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1];

    if (arg === "--root" && value) {
      rootDir = value;
      index += 1;
      continue;
    }

    if (arg === "--allowlist" && value) {
      allowlistPath = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  const result = await scanLegacyBrandReferences({ rootDir, allowlistPath });

  if (result.findings.length > 0) {
    console.error(`Found ${result.findings.length} unapproved legacy brand reference(s):`);
    console.error(formatFindings(result.findings));
    process.exitCode = 1;
    return;
  }

  console.log(`No unapproved legacy brand references found. Scanned ${result.scannedFiles} text file(s).`);
}

const thisFile = fileURLToPath(import.meta.url);

if (process.argv[1] && resolve(process.argv[1]) === thisFile) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

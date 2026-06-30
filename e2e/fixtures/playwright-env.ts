import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ENV_FILES = [".env.local", ".env"];

function stripInlineComment(value: string): string {
  let quote: "'" | "\"" | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if ((char === "'" || char === "\"") && value[index - 1] !== "\\") {
      quote = quote === char ? null : quote ?? char;
    }

    if (char === "#" && !quote && /\s/.test(value[index - 1] ?? "")) {
      return value.slice(0, index).trimEnd();
    }
  }

  return value.trim();
}

function parseValue(rawValue: string): string {
  const value = stripInlineComment(rawValue.trim());
  const quote = value[0];

  if (
    (quote === "\"" || quote === "'") &&
    value[value.length - 1] === quote
  ) {
    return value.slice(1, -1).replace(/\\n/g, "\n");
  }

  return value;
}

export function loadPlaywrightEnv(projectDir: string): void {
  for (const envFile of ENV_FILES) {
    const filePath = join(projectDir, envFile);
    if (!existsSync(filePath)) continue;

    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const assignment = trimmed.startsWith("export ")
        ? trimmed.slice("export ".length).trim()
        : trimmed;
      const separatorIndex = assignment.indexOf("=");
      if (separatorIndex <= 0) continue;

      const key = assignment.slice(0, separatorIndex).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) {
        continue;
      }

      process.env[key] = parseValue(assignment.slice(separatorIndex + 1));
    }
  }
}

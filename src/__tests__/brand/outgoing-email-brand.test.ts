import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const productionTargets = [
  "src/emails",
  "src/lib/email/templates",
  "src/services/email",
  "src/services/notifications",
  "src/services/landlord/tenant-application-service.ts",
  "src/services/agent/agent-team-service.ts",
  "supabase/functions/weekly-digest/index.ts",
];

function collectFiles(target: string): string[] {
  const fullPath = path.join(process.cwd(), target);
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) return [fullPath];

  return fs
    .readdirSync(fullPath, { withFileTypes: true })
    .flatMap((entry) => collectFiles(path.join(target, entry.name)));
}

describe("outgoing email and notification brand copy", () => {
  it("does not hard-code the legacy product name or legacy domains in production email surfaces", () => {
    const files = productionTargets
      .flatMap(collectFiles)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => !/\.test\.(ts|tsx)$/.test(file));

    const failures = files.flatMap((file) => {
      const source = fs.readFileSync(file, "utf8");
      return Array.from(source.matchAll(/Britestate|britestate\.(?:co\.uk|com)/g)).map(
        (match) => `${path.relative(process.cwd(), file)}: ${match[0]}`,
      );
    });

    expect(failures).toEqual([]);
  });
});

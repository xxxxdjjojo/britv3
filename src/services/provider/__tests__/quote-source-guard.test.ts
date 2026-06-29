/**
 * Source-guard test: prevents quotes schema drift from regressing.
 *
 * The real public.quotes table uses `service_request_id` and `validity_date`.
 * The drifted names `request_id` and `valid_until` must never reappear in the
 * quote service code that talks to the quotes table.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

const GUARDED_FILES = [
  resolve(here, "../provider-quote-service.ts"),
  resolve(here, "../../marketplace/quote-service.ts"),
];

describe("quotes schema-drift source guard", () => {
  it.each(GUARDED_FILES)(
    "%s does not reference drifted columns valid_until / request_id",
    (file) => {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/\bvalid_until\b/);
      expect(source).not.toMatch(/\brequest_id\b/);
    },
  );
});

/**
 * RED-phase contract test for
 * `supabase/migrations/20260619140000_epc_dataset.sql`.
 *
 * The migration adds the bulk-EPC backend:
 *  - epc_certificates: lean per-property certificate store (PK
 *    certificate_number); btree indexes on postcode, uprn, lower(paon); RLS on
 *    with NO client policy (service-role/internal only).
 *  - epc_ingest_runs: ingest audit (mirror ppd_ingest_runs) — uuid pk,
 *    file_label/file_sha256 not null, status check default 'running'.
 *  - properties: gains the denormalised epc_* columns the property page reads.
 *
 * The migration does not exist yet → `beforeAll` fails (ENOENT) on sqlFile.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { startPostgres, applyPrerequisites, type DbHarness } from "./harness";

const MIGRATION_PATH = fileURLToPath(
  new URL("../supabase/migrations/20260619140000_epc_dataset.sql", import.meta.url),
);

const RUN = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!RUN)("epc_dataset migration", () => {
  let h: DbHarness;

  beforeAll(() => {
    h = startPostgres();
    applyPrerequisites(h); // provides auth, properties, listings stubs
    h.sqlFile(MIGRATION_PATH);
  });

  afterAll(() => h?.stop());

  it("creates epc_certificates keyed by certificate_number", () => {
    h.sql(
      `insert into public.epc_certificates
         (certificate_number, uprn, postcode, address1, paon,
          current_energy_rating, current_energy_efficiency,
          potential_energy_rating, potential_energy_efficiency,
          property_type, built_form, total_floor_area, construction_age_band,
          tenure, main_fuel, inspection_date)
       values
         ('0151-3058-8202-6036-8204', '68132136', 'SM7 3NE', '1 Stafford Court', '1',
          'D', 64, 'C', 73, 'Flat', NULL, 60, 'England and Wales: 1950-1966',
          'owner-occupied', 'mains gas (not community)', date '2026-02-05');`,
    );
    const got = h.sql(
      `select current_energy_rating || '|' || potential_energy_rating || '|' || total_floor_area::text
       from public.epc_certificates where certificate_number = '0151-3058-8202-6036-8204';`,
    );
    expect(got).toBe("D|C|60");
  });

  it("rejects a duplicate certificate_number (primary key)", () => {
    expect(() =>
      h.sql(
        `insert into public.epc_certificates (certificate_number, postcode)
         values ('0151-3058-8202-6036-8204', 'SM7 3NE');`,
      ),
    ).toThrow();
  });

  it("upserts one row per property_key, keeping the latest inspection_date", () => {
    const upsert = (cert: string, key: string, date: string, rating: string) =>
      h.sql(
        `insert into public.epc_certificates
           (certificate_number, property_key, inspection_date, current_energy_rating)
         values ('${cert}', '${key}', date '${date}', '${rating}')
         on conflict (property_key) do update set
           certificate_number = excluded.certificate_number,
           inspection_date = excluded.inspection_date,
           current_energy_rating = excluded.current_energy_rating
         where epc_certificates.inspection_date is null
            or excluded.inspection_date > epc_certificates.inspection_date;`,
      );
    upsert("CERT-OLD", "uprn:777", "2015-01-01", "E");
    upsert("CERT-NEW", "uprn:777", "2024-01-01", "B"); // newer wins
    upsert("CERT-MID", "uprn:777", "2019-01-01", "D"); // older than current → ignored

    const row = h.sql(
      `select certificate_number || '|' || current_energy_rating || '|' || inspection_date::text
       from public.epc_certificates where property_key = 'uprn:777';`,
    );
    expect(row).toBe("CERT-NEW|B|2024-01-01");
    const count = h.sql(
      `select count(*)::text from public.epc_certificates where property_key = 'uprn:777';`,
    );
    expect(count).toBe("1");
  });

  it("indexes epc_certificates on postcode, uprn and lower(paon)", () => {
    const idx = h.sql(
      `select string_agg(indexdef, ' ;; ') from pg_indexes
       where tablename = 'epc_certificates';`,
    );
    expect(idx).toMatch(/\(postcode\)/);
    expect(idx).toMatch(/\(uprn\)/);
    expect(idx.toLowerCase()).toMatch(/lower\(paon\)/);
  });

  it("creates epc_ingest_runs with a status check defaulting to running", () => {
    const status = h.sql(
      `insert into public.epc_ingest_runs (file_label, file_sha256)
       values ('certificates-2026.csv', 'abc123')
       returning status;`,
    );
    expect(status).toBe("running");
    expect(() =>
      h.sql(
        `insert into public.epc_ingest_runs (file_label, file_sha256, status)
         values ('x', 'y', 'bogus');`,
      ),
    ).toThrow();
  });

  it("extends properties with the denormalised epc_* columns", () => {
    const cols = h.sql(
      `select string_agg(column_name, ',' order by column_name)
       from information_schema.columns
       where table_name = 'properties'
         and column_name like 'epc_%';`,
    );
    for (const c of [
      "epc_potential_rating",
      "epc_potential_score",
      "epc_floor_area_sqm",
      "epc_property_type",
      "epc_built_form",
      "epc_construction_age_band",
      "epc_inspection_date",
      "epc_lmk_key",
      "epc_match_confidence",
    ]) {
      expect(cols).toContain(c);
    }
  });

  it("enables RLS with no client policy on the internal tables", () => {
    const rls = h.sql(
      `select relrowsecurity::text from pg_class
       where relname = 'epc_certificates';`,
    );
    expect(rls).toBe("true");
    const policies = h.sql(
      `select count(*)::text from pg_policies
       where tablename in ('epc_certificates', 'epc_ingest_runs');`,
    );
    expect(policies).toBe("0");
  });
});

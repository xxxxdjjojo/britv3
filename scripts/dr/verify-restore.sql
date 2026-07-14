-- DR restore verification — exact row count of every public base table.
--
-- Run against BOTH the production source and the restored target, then diff the
-- two outputs. Matching counts for the business tables prove the restore is
-- faithful; the bulk reference tables (see restore-verify.md) are expected to
-- read 0 on the target because their DATA is intentionally excluded from the
-- drill (they recover via re-ingest, not from the dump).
--
-- Uses the query_to_xml trick to get an exact count(*) for every table in a
-- single statement without writing per-table SQL or a helper function.
--
-- Usage:
--   psql "$SOURCE_URL" -F$'\t' -tA -f scripts/dr/verify-restore.sql | sort > /tmp/prod_counts.tsv
--   psql "$TARGET_URL" -F$'\t' -tA -f scripts/dr/verify-restore.sql | sort > /tmp/restored_counts.tsv
--   diff /tmp/prod_counts.tsv /tmp/restored_counts.tsv

SELECT
  c.relname AS table_name,
  (
    xpath(
      '/row/cnt/text()',
      query_to_xml(
        format('SELECT count(*) AS cnt FROM public.%I', c.relname),
        false, true, ''
      )
    )::text[]
  )[1]::bigint AS row_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

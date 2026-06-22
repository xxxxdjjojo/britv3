-- ============================================================================
-- sold-parcels: SQL address normalisers (parity with src/lib/epc/match-epc.ts)
--
-- WHAT: immutable functions that reproduce the EPC↔PPD matcher's normalisers in
-- SQL, so the set-based sold-parcels materialisation matches addresses exactly
-- the same way the unit-tested TypeScript matcher does. Parity is asserted by
-- tests/db/address-normaliser-parity.test.ts.
--
--   md_norm_postcode(raw) — uppercase, strip whitespace, re-insert the space
--                           before the 3-char incode. (normalisePostcode)
--   md_norm_paon(raw)     — uppercase, strip punctuation, collapse whitespace,
--                           trim. (normalisePaon)
--
-- The TypeScript matcher additionally expands numeric PAON ranges ("1-5" →
-- {1..5}); that refinement is intentionally NOT replicated here — exact
-- normalised equality covers the overwhelming majority of residential PPD PAONs
-- and keeps the join index-friendly. Unmatched range-PAON sales simply do not
-- appear (under-match rather than mis-match), which is the matcher's own ethos.
--
-- ROLLBACK: drop function public.md_norm_postcode(text);
--           drop function public.md_norm_paon(text);
-- ============================================================================

create or replace function public.md_norm_postcode(raw text)
returns text language sql immutable parallel safe as $$
  select case
    when raw is null then null
    when length(regexp_replace(upper(raw), '\s+', '', 'g')) <= 3
      then regexp_replace(upper(raw), '\s+', '', 'g')
    else
      left(regexp_replace(upper(raw), '\s+', '', 'g'), -3)
      || ' ' ||
      right(regexp_replace(upper(raw), '\s+', '', 'g'), 3)
  end;
$$;

create or replace function public.md_norm_paon(raw text)
returns text language sql immutable parallel safe as $$
  select case when raw is null then null else
    trim(
      regexp_replace(
        regexp_replace(upper(raw), '[^A-Z0-9\s]', '', 'g'),
        '\s+', ' ', 'g'
      )
    )
  end;
$$;

grant execute on function public.md_norm_postcode(text) to anon, authenticated, service_role;
grant execute on function public.md_norm_paon(text)     to anon, authenticated, service_role;

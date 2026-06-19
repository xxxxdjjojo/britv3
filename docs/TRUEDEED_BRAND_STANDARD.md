# TrueDeed Brand Standard

Canonical source: `src/config/brand.ts`.

| Item | Standard |
| --- | --- |
| Display name | TrueDeed |
| Short name | TrueDeed |
| Lowercase token | truedeed |
| Domain | truedeed.co.uk |
| Canonical URL | https://truedeed.co.uk |
| Support email | support@truedeed.co.uk |
| From email | hello@truedeed.co.uk |

## Required Usage

- Use `TrueDeed` for visible product copy.
- Use `truedeed` for lowercase tokens, IDs, slugs, and machine-readable names.
- Use `truedeed.co.uk` for public URLs unless a local/test URL is explicitly required.
- Pull brand values from `brandConfig` where app code already has access to it.

## Prohibited Usage

- Do not introduce `Britestate`, `britestate`, `britestate.co.uk`, or `britestate.com` in new product code.
- Do not rename implementation identifiers that are not user-visible unless the rename is necessary and tested.
- Do not add broad source allowlist patterns to bypass the scanner.

## Allowed Exceptions

The only accepted exceptions are documented in `docs/TRUEDEED_LEGACY_BRAND_ALLOWLIST.md`. Exceptions are technical debt, not brand standard.


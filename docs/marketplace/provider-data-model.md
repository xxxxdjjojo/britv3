# Provider data model (canonical)

Short reference for where service-provider data lives, to prevent the
wrong-table-name class of bug.

## The provider table is `service_provider_details`

`public.service_provider_details` (PK `user_id`) is the **only** provider profile
table. It is created in `supabase/migrations/002_marketplace.sql` and read/written
by `src/services/marketplace/provider-service.ts`, the provider dashboard, the
marketplace/tradespeople search, and landlord→provider flows.

**There is no `service_provider_profiles` table.** Earlier onboarding and
landlord-maintenance code referenced that name; it never existed in any migration
or seed, so those reads 500'd and the onboarding write was a silent no-op. If you
see `service_provider_profiles` anywhere, it is a bug — use `service_provider_details`.

## Categories

`services` is a `service_category[]` (Postgres enum) — not free-text. Valid values
come from the `service_category` enum (plumber, electrician, builder, plasterer,
painter, carpenter, surveying, conveyancing, cleaning, landscaping, handyman,
architect, interior_design, property_management, pest_control, locksmith,
mortgage_broker, moving_company, home_inspector, other). Filter by category with
`.contains("services", [cat])`. Map UI trade labels → enum before writing
(see `src/components/auth/onboarding/tradesperson-onboarding-mapping.ts`).

## Writes

- Full profile (dashboard): `createProviderProfile` / `updateProviderProfile` in
  `provider-service.ts` (validates via `providerProfileSchema`, requires a 50+ char
  `business_description`).
- Onboarding: a lean **valid** upsert built by `buildProviderRow(...)` +
  `generateUniqueSlug(...)`. Required NOT-NULL columns with no default:
  `user_id`, `business_name`, `slug`.
- RLS: owners manage their own row (`"Providers can manage own details"`,
  `user_id = auth.uid()`), so the browser client may upsert it.

## Companies House trust columns are server-authoritative

`companies_house_status` / `companies_house_verified_at` / `incorporation_date`
must **never** be set by clients. They are forced by the
`enforce_company_house_verification()` BEFORE INSERT/UPDATE trigger from the
authoritative `company_verifications` record (written only server-side via
`/api/verification/company`). The trigger is attached to both `agencies` and
`service_provider_details`.

## Slug helpers are client-safe; `provider-service.ts` is not

`slugify` / `generateUniqueSlug` live in `src/lib/marketplace/provider-slug.ts`
(Supabase types only) so Client Components can import them. **Do not import
`provider-service.ts` from a Client Component** — it pulls in `sharp` via the file
validator and breaks the client bundle (`node:events`).

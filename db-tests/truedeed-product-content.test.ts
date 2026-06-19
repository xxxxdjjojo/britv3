/**
 * Contract tests for the TrueDeed product-controlled content migration.
 *
 * The migration may touch only seeded/demo or platform-owned copy. It must not
 * rewrite historical sent campaigns, custom CMS content, or compatibility
 * identifiers such as legacy slugs.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { startPostgres, applyPrerequisites, type DbHarness } from "./harness";

const MIGRATION_PATH = fileURLToPath(
  new URL(
    "../supabase/migrations/20260619103642_truedeed_product_controlled_content.sql",
    import.meta.url,
  ),
);

const DEMO_AGENT = "55555555-5555-5555-5555-555555555555";
const DEMO_PROVIDER = "66666666-6666-6666-6666-666666666666";
const NON_DEMO_USER = "aaaaaaaa-9999-4000-8000-000000000001";

let db: DbHarness;
let snapshotAfterFirstRun = "";

function createContentTables(): void {
  db.sql(`
    create table public.agent_agency_profiles (
      id uuid primary key default gen_random_uuid(),
      agent_id uuid references auth.users(id),
      contact_email text
    );

    create table public.service_provider_details (
      user_id uuid primary key references auth.users(id),
      business_name text,
      slug text unique
    );

    create table public.cms_articles (
      id uuid primary key default gen_random_uuid(),
      article_type text not null,
      slug text not null unique,
      title text not null,
      content jsonb not null,
      excerpt text,
      status text default 'draft',
      seo_title text,
      seo_description text,
      author_id uuid references public.profiles(id)
    );

    create table public.email_campaigns (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      subject text not null,
      content jsonb not null,
      status text default 'draft',
      created_by uuid references public.profiles(id)
    );
  `);
}

function seedRows(): void {
  db.sql(`
    insert into auth.users (id, email) values
      ('11111111-1111-1111-1111-111111111111', 'james.buyer@demo.britestate.co.uk'),
      ('22222222-2222-2222-2222-222222222222', 'sophie.renter@demo.britestate.co.uk'),
      ('33333333-3333-3333-3333-333333333333', 'david.seller@demo.britestate.co.uk'),
      ('44444444-4444-4444-4444-444444444444', 'mike.landlord@demo.britestate.co.uk'),
      ('${DEMO_AGENT}', 'sarah.agent@demo.britestate.co.uk'),
      ('${DEMO_PROVIDER}', 'tom.provider@demo.britestate.co.uk'),
      ('77777777-7777-7777-7777-777777777777', 'admin@demo.britestate.co.uk'),
      ('${NON_DEMO_USER}', 'custom.person@britestate.co.uk');

    insert into public.profiles (id, display_name, is_admin) values
      ('${DEMO_AGENT}', 'Sarah Mitchell', false),
      ('${DEMO_PROVIDER}', 'Tom Richards', false),
      ('${NON_DEMO_USER}', 'Custom Author', true);

    insert into public.agent_agency_profiles (agent_id, contact_email) values
      ('${DEMO_AGENT}', 'sarah.agent@demo.britestate.co.uk'),
      ('${NON_DEMO_USER}', 'custom.agent@demo.britestate.co.uk');

    insert into public.service_provider_details (user_id, business_name, slug) values
      ('${DEMO_PROVIDER}', 'Britestate Test Plumbing', 'britestate-test-plumbing');

    insert into public.cms_articles
      (article_type, slug, title, content, excerpt, status, seo_title, seo_description, author_id)
    values
      (
        'landing',
        'welcome-to-britestate',
        'Welcome to Britestate',
        '{"body":"Welcome to Britestate at https://britestate.co.uk/dashboard"}',
        'Start with Britestate',
        'draft',
        'Welcome to Britestate',
        'Manage property with Britestate.',
        null
      ),
      (
        'blog',
        'custom-britestate-analysis',
        'My Britestate market analysis',
        '{"body":"A custom editorial article mentioning Britestate."}',
        'Custom editorial copy',
        'draft',
        'Custom Britestate article',
        'This was written by an admin and must be preserved.',
        '${NON_DEMO_USER}'
      );

    insert into public.email_campaigns
      (name, subject, content, status, created_by)
    values
      (
        'Welcome to Britestate',
        'Welcome to Britestate',
        '{"body":"Welcome to Britestate. Visit https://britestate.co.uk/dashboard"}',
        'draft',
        null
      ),
      (
        'Your weekly Britestate update',
        'Your weekly Britestate update',
        '{"body":"Historical Britestate campaign already sent."}',
        'sent',
        null
      ),
      (
        'Custom Britestate newsletter',
        'Custom Britestate newsletter',
        '{"body":"Admin-authored Britestate copy."}',
        'draft',
        '${NON_DEMO_USER}'
      );
  `);
}

function snapshot(): string {
  return db.sql(`
    select jsonb_build_object(
      'users', (
        select jsonb_agg(email order by email)
        from auth.users
      ),
      'agentContacts', (
        select jsonb_agg(contact_email order by contact_email)
        from public.agent_agency_profiles
      ),
      'providers', (
        select jsonb_agg(jsonb_build_object('business_name', business_name, 'slug', slug) order by slug)
        from public.service_provider_details
      ),
      'cms', (
        select jsonb_agg(jsonb_build_object(
          'slug', slug,
          'title', title,
          'content', content,
          'excerpt', excerpt,
          'seo_title', seo_title,
          'seo_description', seo_description
        ) order by slug)
        from public.cms_articles
      ),
      'campaigns', (
        select jsonb_agg(jsonb_build_object(
          'name', name,
          'subject', subject,
          'content', content,
          'status', status
        ) order by name)
        from public.email_campaigns
      )
    );
  `);
}

describe.skipIf(!process.env.RUN_DB_TESTS)("truedeed product-controlled content migration", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    createContentTables();
    seedRows();
    db.sqlFile(MIGRATION_PATH);
    snapshotAfterFirstRun = snapshot();
    db.sqlFile(MIGRATION_PATH);
  });

  afterAll(() => {
    db?.stop();
  });

  it("updates seeded demo user and agent contact domains to truedeed", () => {
    expect(
      db.sql(`
        select count(*) from auth.users
        where email like '%@demo.truedeed.co.uk';
      `),
    ).toBe("7");
    expect(
      db.sql(`
        select contact_email from public.agent_agency_profiles
        where agent_id = '${DEMO_AGENT}';
      `),
    ).toBe("sarah.agent@demo.truedeed.co.uk");
  });

  it("updates draft platform-owned CMS and campaign copy without changing compatibility slugs", () => {
    expect(
      db.sql(`
        select title || '|' || (content->>'body') || '|' || seo_description || '|' || slug
        from public.cms_articles
        where slug = 'welcome-to-britestate';
      `),
    ).toBe(
      "Welcome to TrueDeed|Welcome to TrueDeed at https://truedeed.co.uk/dashboard|Manage property with TrueDeed.|welcome-to-britestate",
    );

    expect(
      db.sql(`
        select subject || '|' || (content->>'body')
        from public.email_campaigns
        where name = 'Welcome to TrueDeed';
      `),
    ).toBe("Welcome to TrueDeed|Welcome to TrueDeed. Visit https://truedeed.co.uk/dashboard");
  });

  it("preserves custom rows, sent campaign history, and compatibility identifiers", () => {
    expect(
      db.sql(`
        select email from auth.users
        where id = '${NON_DEMO_USER}';
      `),
    ).toBe("custom.person@britestate.co.uk");

    expect(
      db.sql(`
        select title || '|' || (content->>'body')
        from public.cms_articles
        where slug = 'custom-britestate-analysis';
      `),
    ).toBe("My Britestate market analysis|A custom editorial article mentioning Britestate.");

    expect(
      db.sql(`
        select subject || '|' || (content->>'body')
        from public.email_campaigns
        where status = 'sent';
      `),
    ).toBe("Your weekly Britestate update|Historical Britestate campaign already sent.");

    expect(
      db.sql(`
        select business_name || '|' || slug
        from public.service_provider_details
        where user_id = '${DEMO_PROVIDER}';
      `),
    ).toBe("Britestate Test Plumbing|britestate-test-plumbing");
  });

  it("is idempotent when applied more than once", () => {
    expect(snapshot()).toBe(snapshotAfterFirstRun);
  });
});

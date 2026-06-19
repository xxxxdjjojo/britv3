-- TrueDeed rebrand for product-controlled seed/demo content.
--
-- Scope is intentionally conservative:
-- - update only hard-coded demo accounts and the matching demo agency contact;
-- - update only platform-owned draft CMS/email campaign copy with known seed
--   titles/subjects;
-- - preserve compatibility identifiers (UUIDs, slugs) and historical sent
--   campaign copy.

create or replace function pg_temp.truedeed_rebrand_text(value text)
returns text
language sql
immutable
as $$
  select case
    when value is null then null
    else replace(
      replace(
        replace(
          replace(value, 'Britestate', 'TrueDeed'),
          'britestate.co.uk', 'truedeed.co.uk'
        ),
        'britestate.test', 'truedeed.test'
      ),
      'demo.britestate.co.uk', 'demo.truedeed.co.uk'
    )
  end;
$$;

do $$
begin
  if to_regclass('auth.users') is not null then
    update auth.users as u
    set email = v.new_email
    from (
      values
        ('11111111-1111-1111-1111-111111111111'::uuid, 'james.buyer@demo.britestate.co.uk', 'james.buyer@demo.truedeed.co.uk'),
        ('22222222-2222-2222-2222-222222222222'::uuid, 'sophie.renter@demo.britestate.co.uk', 'sophie.renter@demo.truedeed.co.uk'),
        ('33333333-3333-3333-3333-333333333333'::uuid, 'david.seller@demo.britestate.co.uk', 'david.seller@demo.truedeed.co.uk'),
        ('44444444-4444-4444-4444-444444444444'::uuid, 'mike.landlord@demo.britestate.co.uk', 'mike.landlord@demo.truedeed.co.uk'),
        ('55555555-5555-5555-5555-555555555555'::uuid, 'sarah.agent@demo.britestate.co.uk', 'sarah.agent@demo.truedeed.co.uk'),
        ('66666666-6666-6666-6666-666666666666'::uuid, 'tom.provider@demo.britestate.co.uk', 'tom.provider@demo.truedeed.co.uk'),
        ('77777777-7777-7777-7777-777777777777'::uuid, 'admin@demo.britestate.co.uk', 'admin@demo.truedeed.co.uk')
    ) as v(id, old_email, new_email)
    where u.id = v.id
      and u.email = v.old_email;
  end if;

  if to_regclass('public.agent_agency_profiles') is not null then
    update public.agent_agency_profiles
    set contact_email = 'sarah.agent@demo.truedeed.co.uk'
    where agent_id = '55555555-5555-5555-5555-555555555555'::uuid
      and contact_email = 'sarah.agent@demo.britestate.co.uk';
  end if;

  if to_regclass('public.cms_articles') is not null then
    update public.cms_articles
    set
      title = pg_temp.truedeed_rebrand_text(title),
      content = pg_temp.truedeed_rebrand_text(content::text)::jsonb,
      excerpt = pg_temp.truedeed_rebrand_text(excerpt),
      seo_title = pg_temp.truedeed_rebrand_text(seo_title),
      seo_description = pg_temp.truedeed_rebrand_text(seo_description)
    where author_id is null
      and (
        slug in (
          'welcome-to-britestate',
          'about-britestate',
          'why-britestate',
          'how-britestate-works',
          'join-britestate'
        )
        or title in (
          'Welcome to Britestate',
          'About Britestate',
          'Why Britestate',
          'How Britestate Works',
          'Join Britestate'
        )
      )
      and (
        title ilike '%britestate%'
        or content::text ilike '%britestate%'
        or excerpt ilike '%britestate%'
        or seo_title ilike '%britestate%'
        or seo_description ilike '%britestate%'
      );
  end if;

  if to_regclass('public.email_campaigns') is not null then
    update public.email_campaigns
    set
      name = pg_temp.truedeed_rebrand_text(name),
      subject = pg_temp.truedeed_rebrand_text(subject),
      content = pg_temp.truedeed_rebrand_text(content::text)::jsonb
    where created_by is null
      and status in ('draft', 'scheduled')
      and (
        name in (
          'Welcome to Britestate',
          'New lead from Britestate',
          'Your weekly Britestate update'
        )
        or subject in (
          'Welcome to Britestate',
          'New lead from Britestate',
          'Your weekly Britestate update'
        )
      )
      and (
        name ilike '%britestate%'
        or subject ilike '%britestate%'
        or content::text ilike '%britestate%'
      );
  end if;
end $$;

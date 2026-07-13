-- ============================================================================
-- support_tickets — in-house support ticketing (PR 6). Replaces the previous
-- fire-and-forget contact form: submissions are now persisted so nothing is
-- lost and logged-in customers can track status. Guests (no user_id) are
-- supported. Admin triage queue arrives in PR 7.
--
-- RLS: customers read their OWN tickets and non-internal messages; they may
-- reply to their own open tickets. Creation and all admin access go through the
-- service-role client (public contact route + audited admin routes).
-- ============================================================================

create table if not exists public.support_tickets (
  id                uuid        primary key default gen_random_uuid(),
  reference         text        not null unique,   -- human-readable 'TD-XXXXXX'
  user_id           uuid        references auth.users(id) on delete set null,
  email             text        not null,
  name              text,
  category          text        not null default 'other'
                      check (category in
                        ('account','payments','listings','verification','gdpr','technical','other')),
  subject           text        not null,
  status            text        not null default 'open'
                      check (status in
                        ('open','pending_customer','pending_internal','resolved','closed')),
  priority          text        not null default 'normal'
                      check (priority in ('urgent','high','normal','low')),
  assigned_admin_id uuid        references auth.users(id),
  source            text        not null default 'contact_form',
  correlation_id    text,
  first_response_at timestamptz,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists support_tickets_user_idx on public.support_tickets (user_id, created_at desc);
create index if not exists support_tickets_status_idx on public.support_tickets (status, created_at desc);

create table if not exists public.support_ticket_messages (
  id            uuid        primary key default gen_random_uuid(),
  ticket_id     uuid        not null references public.support_tickets(id) on delete cascade,
  author_type   text        not null check (author_type in ('customer','admin','system')),
  author_id     uuid,
  body          text        not null,
  internal_note boolean     not null default false,
  email_log_id  uuid,
  created_at    timestamptz not null default now()
);

create index if not exists support_ticket_messages_ticket_idx
  on public.support_ticket_messages (ticket_id, created_at asc);

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;

-- Customers read their own tickets.
drop policy if exists support_tickets_owner_read on public.support_tickets;
create policy support_tickets_owner_read
  on public.support_tickets
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Customers read non-internal messages on their own tickets.
drop policy if exists support_ticket_messages_owner_read on public.support_ticket_messages;
create policy support_ticket_messages_owner_read
  on public.support_ticket_messages
  for select
  to authenticated
  using (
    not internal_note
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = (select auth.uid())
    )
  );

-- Customers may reply (customer-authored, non-internal) to their own open tickets.
drop policy if exists support_ticket_messages_owner_insert on public.support_ticket_messages;
create policy support_ticket_messages_owner_insert
  on public.support_ticket_messages
  for insert
  to authenticated
  with check (
    author_type = 'customer'
    and not internal_note
    and author_id = (select auth.uid())
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id
        and t.user_id = (select auth.uid())
        and t.status in ('open','pending_customer','pending_internal')
    )
  );

grant select on public.support_tickets to authenticated;
grant select, insert on public.support_ticket_messages to authenticated;
grant select, insert, update, delete on public.support_tickets to service_role;
grant select, insert, update, delete on public.support_ticket_messages to service_role;

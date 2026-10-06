-- Newsletter subscribers table for Doverow welcome page

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Allow anonymous newsletter signups" on public.newsletter_subscribers;

create policy "Allow anonymous newsletter signups"
  on public.newsletter_subscribers
  for insert
  to anon
  with check (true);

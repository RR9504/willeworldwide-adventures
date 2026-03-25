-- Trips table
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  destination text not null,
  category text not null default 'other' check (category in ('ski', 'group', 'corporate', 'other')),
  start_date date not null,
  end_date date not null,
  price numeric not null default 0,
  currency text not null default 'SEK',
  max_participants integer not null default 50,
  show_spots_left boolean not null default true,
  spots_left_threshold integer,
  image_url text not null default '',
  image_position text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  form_fields jsonb not null default '[]'::jsonb,
  presentation_fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Registrations table
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  form_data jsonb not null default '{}'::jsonb,
  presentation_data jsonb,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'partial', 'refunded')),
  payment_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast registration lookups
create index idx_registrations_trip_id on public.registrations(trip_id);

-- Auto-update updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trips_updated_at before update on public.trips
  for each row execute function public.update_updated_at();

create trigger registrations_updated_at before update on public.registrations
  for each row execute function public.update_updated_at();

-- RLS: Open access for now (no auth yet)
alter table public.trips enable row level security;
alter table public.registrations enable row level security;

create policy "Allow all access to trips" on public.trips for all using (true) with check (true);
create policy "Allow all access to registrations" on public.registrations for all using (true) with check (true);

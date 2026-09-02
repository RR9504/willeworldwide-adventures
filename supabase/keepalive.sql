-- Körs EN gång i SQL-editorn på mejl/SMS-projektet (seprpsyzqmppsnmzptyo,
-- konto robin.ruuska@live.se). Inte på projektet som data-api använder.
--
-- Ger keepalive-workflowen något att läsa som garanterat rör databasen.
-- Utan en riktig tabell finns inget en anon-nyckel får läsa i det projektet:
-- /rest/v1/ (OpenAPI-roten) är service_role-only, och en service_role-nyckel
-- ska inte ligga i GitHub.

create table if not exists public.keepalive (
  id         int primary key default 1,
  pinged_at  timestamptz not null default now(),
  constraint keepalive_single_row check (id = 1)
);

insert into public.keepalive (id) values (1) on conflict (id) do nothing;

alter table public.keepalive enable row level security;

-- Tabellen innehåller ingenting känsligt — bara en rad så att en läsning
-- ska ha något att svara med.
drop policy if exists "keepalive är läsbar för alla" on public.keepalive;
create policy "keepalive är läsbar för alla"
  on public.keepalive for select
  using (true);

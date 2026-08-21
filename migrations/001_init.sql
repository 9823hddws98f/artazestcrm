-- 001_init.sql — volledige opzet van een vers Supabase-project.
--
-- Vervangt het oude supabase_schema.sql. Verschil: RLS staat vanaf de eerste
-- dag aan. In de oude opzet stond RLS uit en had de rol `anon` alle rechten,
-- terwijl de anon-key in de publieke JS-bundle zit — daarmee kon iedereen die
-- de site opende alle data lezen en schrijven.
--
-- Nu kan alleen een ingelogde gebruiker (rol `authenticated`) bij de data.
-- Inloggen loopt via Supabase Auth; zie stap 2 in SECURITY.md.
--
-- Plakken in: Supabase dashboard > SQL Editor > New query > Run.

-- ---------------------------------------------------------------------------
-- 1. Tabellen
-- ---------------------------------------------------------------------------

create table if not exists tasks (
  id text primary key,
  title text,
  category text,
  assignee text,
  status text default 'todo',
  priority text default 'normal',
  notes text,
  "dueDate" text,
  "plannedDate" text,
  tags jsonb default '[]',
  subtasks jsonb default '[]',
  completed boolean default false,
  archived boolean default false,
  "archivedAt" text,
  "createdAt" text
);

create table if not exists inventory (
  id text primary key,
  name text,
  section text,
  quantity integer default 0,
  "minStock" integer default 0,
  "leadTimeDays" integer default 0,
  supplier text,
  notes text,
  "startStock" integer default 0,
  batches jsonb default '[]'
);

create table if not exists catalog (
  id text primary key,
  name text,
  stage text,
  colors jsonb default '[]',
  designer text,
  notes text,
  online boolean default false
);

create table if not exists investments (
  id text primary key,
  description text,
  category text,
  amount numeric default 0,
  date text,
  notes text
);

-- Werd wel gelezen in Analytics.jsx maar stond niet in het oude schema.
create table if not exists budgets (
  id text primary key,
  category text,
  amount numeric default 0
);

create table if not exists settings (
  key text primary key,
  value jsonb
);

create table if not exists checkins (
  id text primary key,
  name text,
  via text,
  topic text,
  "checkedDate" text
);

-- ---------------------------------------------------------------------------
-- 2. RLS op alles in het publieke schema
-- ---------------------------------------------------------------------------

-- Een loop in plaats van een regel per tabel, zodat tabellen die je later
-- toevoegt automatisch meegaan als je dit opnieuw draait.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('revoke all on public.%I from anon', t.tablename);
    execute format('grant all on public.%I to authenticated', t.tablename);
    execute format('drop policy if exists team_full_access on public.%I', t.tablename);
    execute format(
      'create policy team_full_access on public.%I for all to authenticated using (true) with check (true)',
      t.tablename
    );
  end loop;
end $$;

-- Nieuwe tabellen krijgen standaard geen rechten meer voor anon.
alter default privileges in schema public revoke all on tables from anon;

-- ---------------------------------------------------------------------------
-- 3. Opslag voor artwork-afbeeldingen
-- ---------------------------------------------------------------------------

-- Publiek leesbaar, want de afbeeldingen worden in de app getoond via een
-- gewone URL. Uploaden en verwijderen kan alleen ingelogd.
insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true)
on conflict (id) do update set public = true;

drop policy if exists artworks_public_read on storage.objects;
create policy artworks_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'artworks');

drop policy if exists artworks_team_write on storage.objects;
create policy artworks_team_write on storage.objects
  for all to authenticated
  using (bucket_id = 'artworks')
  with check (bucket_id = 'artworks');

-- ---------------------------------------------------------------------------
-- 4. Controle
-- ---------------------------------------------------------------------------

-- Alles hoort rowsecurity = true te tonen.
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;

-- Elke tabel hoort precies één policy `team_full_access` te hebben.
select tablename, policyname, roles from pg_policies where schemaname = 'public' order by tablename;

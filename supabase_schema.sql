-- Artazest CRM schema
-- Plak dit in Supabase > SQL Editor > New query > Run

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

-- Disable RLS (iedereen in het team heeft toegang via de anon key)
alter table tasks disable row level security;
alter table inventory disable row level security;
alter table catalog disable row level security;
alter table investments disable row level security;
alter table settings disable row level security;
alter table checkins disable row level security;

-- Maak tabellen publiek leesbaar/schrijfbaar
grant all on tasks to anon, authenticated;
grant all on inventory to anon, authenticated;
grant all on catalog to anon, authenticated;
grant all on investments to anon, authenticated;
grant all on settings to anon, authenticated;
grant all on checkins to anon, authenticated;

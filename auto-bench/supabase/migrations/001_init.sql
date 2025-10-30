create table public.model_providers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table public.models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.model_providers(id) on delete cascade,
  label text not null,
  api_identifier text not null,
  params jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  spec jsonb not null,
  status text not null default 'pending'
);
create index on public.tasks(created_at desc);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  model_id uuid references public.models(id) on delete cascade,
  prompt text not null,
  code text,
  status text not null default 'queued',
  error text,
  metrics jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (task_id, model_id)
);

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade,
  kind text not null,
  storage_path text not null,
  width int,
  height int,
  duration_ms int
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  submission_a uuid references public.submissions(id) on delete set null,
  submission_b uuid references public.submissions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  winner_submission uuid references public.submissions(id) on delete set null,
  loser_submission uuid references public.submissions(id) on delete set null,
  voter_key text not null,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  constraint unique_vote_once unique (match_id, voter_key)
);

create table public.ratings (
  model_id uuid primary key references public.models(id) on delete cascade,
  rating int not null default 1500
);

create table public.rating_history (
  id bigserial primary key,
  model_id uuid references public.models(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  delta int not null,
  rating_after int not null,
  created_at timestamptz not null default now()
);

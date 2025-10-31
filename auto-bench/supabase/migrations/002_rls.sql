alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.artifacts enable row level security;
alter table public.matches enable row level security;
alter table public.votes enable row level security;
alter table public.ratings enable row level security;
alter table public.rating_history enable row level security;

create policy "public_read_tasks" on public.tasks for select using (true);
create policy "public_read_submissions" on public.submissions for select using (true);
create policy "public_read_artifacts" on public.artifacts for select using (true);
create policy "public_read_matches" on public.matches for select using (true);
create policy "public_read_ratings" on public.ratings for select using (true);
create policy "public_read_rating_hist" on public.rating_history for select using (true);

create policy "public_insert_votes" on public.votes for insert with check (true);
create policy "no_read_votes" on public.votes for select using (false);

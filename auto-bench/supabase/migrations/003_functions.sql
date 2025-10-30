create or replace function public.elo_expected(a int, b int)
returns numeric language sql immutable as $$
  select 1.0 / (1.0 + power(10.0, ((b - a)::numeric / 400.0)));
$$;

create or replace function public.apply_vote_elo(
  p_winner uuid,
  p_loser uuid,
  p_match uuid,
  p_k int default 32
) returns void language plpgsql security definer as $$
declare
  w_model uuid; l_model uuid; w_old int; l_old int;
  exp_w numeric; exp_l numeric;
  w_new int; l_new int;
begin
  select s.model_id into w_model from public.submissions s where s.id = p_winner;
  select s.model_id into l_model from public.submissions s where s.id = p_loser;

  select rating into w_old from public.ratings where model_id = w_model for update;
  select rating into l_old from public.ratings where model_id = l_model for update;

  if w_old is null then insert into public.ratings(model_id,rating) values (w_model,1500) on conflict do nothing; w_old := 1500; end if;
  if l_old is null then insert into public.ratings(model_id,rating) values (l_model,1500) on conflict do nothing; l_old := 1500; end if;

  exp_w := public.elo_expected(w_old, l_old);
  exp_l := public.elo_expected(l_old, w_old);

  w_new := round(w_old + p_k * (1 - exp_w));
  l_new := round(l_old + p_k * (0 - exp_l));

  update public.ratings set rating = w_new where model_id = w_model;
  update public.ratings set rating = l_new where model_id = l_model;

  insert into public.rating_history(model_id, match_id, delta, rating_after)
  values (w_model, p_match, (w_new - w_old), w_new),
         (l_model, p_match, (l_new - l_old), l_new);
end; $$;

create or replace function public.ratings_with_sparkline()
returns table (
  model_id uuid,
  rating int,
  model_label text,
  provider_name text,
  sparkline int[]
) language sql security definer as $$
  select
    r.model_id,
    r.rating,
    m.label as model_label,
    mp.name as provider_name,
    coalesce(
      (
        select array_agg(history.rating_after order by history.created_at asc)
        from (
          select rating_after, created_at
          from public.rating_history rh
          where rh.model_id = r.model_id
          order by rh.created_at desc
          limit 10
        ) history
      ),
      array[r.rating]
    ) as sparkline
  from public.ratings r
  join public.models m on m.id = r.model_id
  join public.model_providers mp on mp.id = m.provider_id
  order by r.rating desc;
$$;

create or replace function public.exec_sql(sql text)
returns json language plpgsql security definer as $$
declare
  result json;
begin
  execute format('select json_agg(t) from (%s) as t', sql) into result;
  return coalesce(result, '[]'::json);
exception
  when others then
    return json_build_object('error', SQLERRM);
end;
$$;

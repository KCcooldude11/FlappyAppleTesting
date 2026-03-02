-- Flappy Apple launch hardening migration
-- Safe to run multiple times.

begin;

-- ------------------------------------------------------------
-- 1) Profiles: normalize + enforce device/name integrity
-- ------------------------------------------------------------

-- Normalize obvious legacy issues before adding constraints.
update public.profiles
set
  device_id = trim(device_id),
  name = left(trim(name), 16)
where device_id is not null or name is not null;

-- Remove rows with unusable identity data.
delete from public.profiles
where
  device_id is null
  or length(trim(device_id)) < 12
  or length(trim(device_id)) > 64
  or trim(device_id) !~ '^[A-Za-z0-9-]+$';

-- Ensure names are always valid for existing rows.
update public.profiles
set name = 'Player'
where
  name is null
  or length(trim(name)) < 3
  or trim(name) ilike 'guest';

-- Remove duplicate device ids while keeping one row.
with dups as (
  select ctid
  from (
    select ctid, row_number() over (partition by device_id order by ctid) as rn
    from public.profiles
  ) x
  where x.rn > 1
)
delete from public.profiles p
using dups
where p.ctid = dups.ctid;

create unique index if not exists profiles_device_id_uidx on public.profiles (device_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_device_id_format_chk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_device_id_format_chk
      check (
        length(trim(device_id)) between 12 and 64
        and trim(device_id) ~ '^[A-Za-z0-9-]+$'
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_name_valid_chk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_name_valid_chk
      check (
        length(trim(name)) between 3 and 16
        and lower(trim(name)) <> 'guest'
      );
  end if;
end $$;

-- ------------------------------------------------------------
-- 2) Scores: enforce score bounds + referential integrity
-- ------------------------------------------------------------

-- Clean impossible values and malformed ids first.
delete from public.scores
where
  device_id is null
  or length(trim(device_id)) < 12
  or length(trim(device_id)) > 64
  or trim(device_id) !~ '^[A-Za-z0-9-]+$'
  or score is null
  or score < 0
  or score > 10000;

-- Remove orphan score rows so FK can be added safely.
delete from public.scores s
where not exists (
  select 1 from public.profiles p where p.device_id = s.device_id
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scores_score_range_chk'
      and conrelid = 'public.scores'::regclass
  ) then
    alter table public.scores
      add constraint scores_score_range_chk
      check (score between 0 and 10000);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'scores_device_fk_profiles'
      and conrelid = 'public.scores'::regclass
  ) then
    alter table public.scores
      add constraint scores_device_fk_profiles
      foreign key (device_id)
      references public.profiles(device_id)
      on update cascade
      on delete cascade;
  end if;
end $$;

create index if not exists scores_rank_idx on public.scores (score desc, created_at asc);
create index if not exists scores_device_created_idx on public.scores (device_id, created_at asc);

-- ------------------------------------------------------------
-- 3) View used by /get-my-rank endpoint
-- ------------------------------------------------------------

create or replace view public.player_best_scores as
with best as (
  select
    s.device_id,
    max(s.score) as best_score
  from public.scores s
  group by s.device_id
),
first_best as (
  select
    b.device_id,
    b.best_score,
    min(s.created_at) as first_achieved_at
  from best b
  join public.scores s
    on s.device_id = b.device_id
   and s.score = b.best_score
  group by b.device_id, b.best_score
)
select
  fb.device_id,
  p.name,
  fb.best_score,
  fb.first_achieved_at
from first_best fb
join public.profiles p on p.device_id = fb.device_id;

-- ------------------------------------------------------------
-- 4) RLS hardening (service role still works)
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.scores enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
revoke all on table public.scores from anon;
revoke all on table public.scores from authenticated;

grant select on public.player_best_scores to anon;
grant select on public.player_best_scores to authenticated;

commit;

-- 0001_init.sql
-- Core schema for the Goddess Physique fitness tracker.
-- All private data is owned by an authenticated user (auth.uid()).
-- Run this in the Supabase SQL Editor or via `supabase db push`.

create extension if not exists "pgcrypto";

-- Shared updated_at trigger helper -------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- daily_logs -----------------------------------------------------------------
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  day_name text,
  morning_weight_kg numeric(5,2),
  calories numeric(7,1),
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fat_g numeric(6,1),
  steps integer,
  workout_completed boolean not null default false,
  water_l numeric(4,2),
  sleep_hours numeric(4,2),
  energy_rating smallint check (energy_rating between 1 and 5),
  face_skin_rating smallint check (face_skin_rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);
create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);

drop trigger if exists daily_logs_updated_at on public.daily_logs;
create trigger daily_logs_updated_at before update on public.daily_logs
  for each row execute function public.set_updated_at();

-- weekly_progress ------------------------------------------------------------
create table if not exists public.weekly_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 52),
  week_start date not null,
  avg_weight_kg numeric(5,2),
  waist_cm numeric(5,1),
  hip_cm numeric(5,1),
  hip_thrust_kg numeric(6,1),
  core_benchmark text,
  avg_daily_steps integer,
  workouts_completed integer,
  workouts_planned integer,
  nutrition_adherence_pct numeric(5,1),
  avg_sleep_hours numeric(4,2),
  energy_face_rating numeric(3,1),
  manual_fields text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_number)
);
create index if not exists weekly_progress_user_week_idx on public.weekly_progress (user_id, week_number);

drop trigger if exists weekly_progress_updated_at on public.weekly_progress;
create trigger weekly_progress_updated_at before update on public.weekly_progress
  for each row execute function public.set_updated_at();

-- workout_templates ----------------------------------------------------------
create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  session_label text not null,
  focus text,
  is_rest boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workout_templates_user_idx on public.workout_templates (user_id, day_of_week, sort_order);

drop trigger if exists workout_templates_updated_at on public.workout_templates;
create trigger workout_templates_updated_at before update on public.workout_templates
  for each row execute function public.set_updated_at();

-- workout_template_exercises -------------------------------------------------
create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_name text not null,
  default_sets integer not null default 4 check (default_sets between 1 and 12),
  default_reps text,
  target_rir integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists workout_template_exercises_template_idx
  on public.workout_template_exercises (template_id, sort_order);

-- workout_sessions -----------------------------------------------------------
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null,
  week_number integer,
  session_label text not null,
  focus text,
  status text not null default 'planned' check (status in ('planned','completed','skipped')),
  technique_notes text,
  symptoms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workout_sessions_user_date_idx on public.workout_sessions (user_id, session_date desc);

drop trigger if exists workout_sessions_updated_at on public.workout_sessions;
create trigger workout_sessions_updated_at before update on public.workout_sessions
  for each row execute function public.set_updated_at();

-- workout_exercises ----------------------------------------------------------
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_name text not null,
  sort_order integer not null default 0,
  rir integer,
  technique_notes text,
  symptoms text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists workout_exercises_session_idx on public.workout_exercises (session_id, sort_order);

-- workout_sets ---------------------------------------------------------------
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number integer not null check (set_number between 1 and 20),
  weight_kg numeric(6,2),
  reps integer,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists workout_sets_exercise_idx on public.workout_sets (workout_exercise_id, set_number);

-- meal_entries ---------------------------------------------------------------
create table if not exists public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  meal_type text not null,
  food text not null,
  portion text,
  calories numeric(7,1),
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fat_g numeric(6,1),
  water_l numeric(4,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists meal_entries_user_date_idx on public.meal_entries (user_id, log_date desc);

drop trigger if exists meal_entries_updated_at on public.meal_entries;
create trigger meal_entries_updated_at before update on public.meal_entries
  for each row execute function public.set_updated_at();

-- body_measurements ----------------------------------------------------------
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(5,2),
  waist_cm numeric(5,1),
  hip_cm numeric(5,1),
  chest_cm numeric(5,1),
  thigh_cm numeric(5,1),
  arm_cm numeric(5,1),
  notes text,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists body_measurements_user_date_idx on public.body_measurements (user_id, measured_on desc);

drop trigger if exists body_measurements_updated_at on public.body_measurements;
create trigger body_measurements_updated_at before update on public.body_measurements
  for each row execute function public.set_updated_at();

-- roadmap_weeks --------------------------------------------------------------
create table if not exists public.roadmap_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 52),
  focus text,
  training_goals text,
  nutrition_goals text,
  review_checkpoint text,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_number)
);
create index if not exists roadmap_weeks_user_week_idx on public.roadmap_weeks (user_id, week_number);

drop trigger if exists roadmap_weeks_updated_at on public.roadmap_weeks;
create trigger roadmap_weeks_updated_at before update on public.roadmap_weeks
  for each row execute function public.set_updated_at();

-- fitness_settings -----------------------------------------------------------
create table if not exists public.fitness_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  programme_start_date date not null default current_date,
  starting_weight_kg numeric(5,2),
  starting_waist_cm numeric(5,1),
  target_calories numeric(7,1) not null default 2100,
  target_protein_g numeric(6,1) not null default 135,
  target_carbs_g numeric(6,1) not null default 250,
  target_fat_g numeric(6,1) not null default 62,
  target_water_l numeric(4,2) not null default 2.5,
  target_steps integer not null default 8000,
  target_sleep_hours numeric(4,2) not null default 7.5,
  goals text,
  units text not null default 'metric' check (units in ('metric','imperial')),
  theme text not null default 'system' check (theme in ('light','dark','system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists fitness_settings_updated_at on public.fitness_settings;
create trigger fitness_settings_updated_at before update on public.fitness_settings
  for each row execute function public.set_updated_at();
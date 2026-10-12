-- 0004_provision.sql
-- Seeds default settings, the weekly workout template, and the 12-week roadmap
-- for a newly created user. Re-runnable (idempotent per user).

create or replace function public.seed_user_defaults(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tpl uuid;
begin
  -- Settings -----------------------------------------------------------------
  insert into public.fitness_settings (user_id)
  values (uid)
  on conflict (user_id) do nothing;

  -- Workout template ---------------------------------------------------------
  if not exists (select 1 from public.workout_templates where user_id = uid) then
    -- Monday
    insert into public.workout_templates (user_id, name, day_of_week, session_label, focus, sort_order)
    values (uid, 'Monday – Glutes, Hamstrings & Abs', 1, 'Glutes, hamstrings and abs', 'glutes', 1)
    returning id into tpl;
    insert into public.workout_template_exercises (user_id, template_id, exercise_name, default_sets, default_reps, target_rir, sort_order) values
      (uid, tpl, 'Hip thrust', 4, '8-10', 2, 1),
      (uid, tpl, 'Romanian deadlift', 4, '8-10', 2, 2),
      (uid, tpl, 'Leg curl', 3, '10-12', 2, 3),
      (uid, tpl, 'Cable crunch', 3, '12-15', 2, 4),
      (uid, tpl, 'Dead bug', 3, '10/side', 3, 5);

    -- Tuesday
    insert into public.workout_templates (user_id, name, day_of_week, session_label, focus, sort_order)
    values (uid, 'Tuesday – Chest, Shoulders & Triceps', 2, 'Chest, shoulders and triceps', 'upper push', 2)
    returning id into tpl;
    insert into public.workout_template_exercises (user_id, template_id, exercise_name, default_sets, default_reps, target_rir, sort_order) values
      (uid, tpl, 'Incline dumbbell press', 4, '8-10', 2, 1),
      (uid, tpl, 'Flat bench press', 4, '8-10', 2, 2),
      (uid, tpl, 'Lateral raise', 3, '12-15', 2, 3),
      (uid, tpl, 'Pec deck', 3, '10-12', 2, 4),
      (uid, tpl, 'Triceps pushdown', 3, '10-12', 2, 5);

    -- Wednesday
    insert into public.workout_templates (user_id, name, day_of_week, session_label, focus, sort_order)
    values (uid, 'Wednesday – Back, Rear Delts & Core', 3, 'Back, rear delts and core', 'upper pull', 3)
    returning id into tpl;
    insert into public.workout_template_exercises (user_id, template_id, exercise_name, default_sets, default_reps, target_rir, sort_order) values
      (uid, tpl, 'Pull-up or assisted pull-up', 4, '6-10', 2, 1),
      (uid, tpl, 'Chest-supported row', 4, '8-10', 2, 2),
      (uid, tpl, 'Lat pulldown', 3, '10-12', 2, 3),
      (uid, tpl, 'Reverse pec deck', 3, '12-15', 2, 4),
      (uid, tpl, 'Pallof press', 3, '10/side', 3, 5),
      (uid, tpl, 'Side plank', 3, '30-45s/side', 3, 6);

    -- Thursday rest
    insert into public.workout_templates (user_id, name, day_of_week, session_label, focus, is_rest, sort_order)
    values (uid, 'Thursday – Rest or Recovery', 4, 'Rest or recovery', 'recovery', true, 4);

    -- Friday
    insert into public.workout_templates (user_id, name, day_of_week, session_label, focus, sort_order)
    values (uid, 'Friday – Glutes, Legs & Core', 5, 'Glutes, legs and core', 'lower body', 5)
    returning id into tpl;
    insert into public.workout_template_exercises (user_id, template_id, exercise_name, default_sets, default_reps, target_rir, sort_order) values
      (uid, tpl, 'Squat or leg press', 4, '8-10', 2, 1),
      (uid, tpl, 'Bulgarian split squat', 3, '10/leg', 2, 2),
      (uid, tpl, 'Reverse lunge', 3, '10/leg', 2, 3),
      (uid, tpl, 'Cable glute kickback', 3, '12-15/side', 2, 4),
      (uid, tpl, 'Hanging knee raise', 3, '12-15', 2, 5);

    -- Saturday
    insert into public.workout_templates (user_id, name, day_of_week, session_label, focus, sort_order)
    values (uid, 'Saturday – Optional Upper Body & Abs', 6, 'Optional upper body and abs', 'optional', 6)
    returning id into tpl;
    insert into public.workout_template_exercises (user_id, template_id, exercise_name, default_sets, default_reps, target_rir, sort_order) values
      (uid, tpl, 'One-arm row', 3, '10-12/side', 2, 1),
      (uid, tpl, 'Biceps curl', 3, '10-12', 2, 2),
      (uid, tpl, 'Reverse crunch', 3, '12-15', 2, 3),
      (uid, tpl, 'Bird dog', 3, '10/side', 3, 4);

    -- Sunday rest
    insert into public.workout_templates (user_id, name, day_of_week, session_label, focus, is_rest, sort_order)
    values (uid, 'Sunday – Rest & Recovery', 0, 'Rest and recovery', 'recovery', true, 0);
  end if;

  -- 12-week roadmap ----------------------------------------------------------
  if not exists (select 1 from public.roadmap_weeks where user_id = uid) then
    insert into public.roadmap_weeks
      (user_id, week_number, focus, training_goals, nutrition_goals, review_checkpoint)
    select
      uid,
      w,
      case
        when w <= 4 then 'Foundation & technique'
        when w <= 8 then 'Progressive overload'
        else 'Peak & consolidation'
      end,
      case
        when w <= 4 then 'Learn movements, establish 4 sessions/week, log every set at RIR 2-3.'
        when w <= 8 then 'Add load or reps weekly, keep RIR 1-2, prioritise hip thrust & squat progression.'
        else 'Refine technique under load, maintain 4-5 sessions/week, deload in week 12 if needed.'
      end,
      case
        when w <= 4 then 'Hit protein target daily, keep water >= 2.5 L, 8k steps baseline.'
        when w <= 8 then 'Maintain calorie target within +/- 10%, keep steps trending up.'
        else 'Hold nutrition consistent, prioritise sleep 7.5h+, plan maintenance nutrition.'
      end,
      case
        when w = 4 then 'Week 4 review: measurements, photos, energy trends.'
        when w = 8 then 'Week 8 review: strength benchmarks, waist/hip, adherence.'
        when w = 12 then 'Week 12 review: full reassessment and next block planning.'
        else 'Weekly check-in: weight, waist, sleep, adherence.'
      end
    from generate_series(1, 12) as w;
  end if;
end;
$$;

-- Trigger: seed defaults whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_user_defaults(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
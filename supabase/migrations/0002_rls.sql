-- 0002_rls.sql
-- Row Level Security: every private table is readable/writable ONLY by the
-- authenticated owner (auth.uid()). This is the security boundary — the frontend
-- never relies on hiding UI to protect data.

do $$
declare
  t text;
  tables text[] := array[
    'daily_logs',
    'weekly_progress',
    'workout_templates',
    'workout_template_exercises',
    'workout_sessions',
    'workout_exercises',
    'workout_sets',
    'meal_entries',
    'body_measurements',
    'roadmap_weeks',
    'fitness_settings'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);

    -- NOTE: we deliberately do NOT use FORCE ROW LEVEL SECURITY, so the
    -- SECURITY DEFINER provisioning function (owned by the migration role,
    -- which owns these tables) can seed defaults for a brand-new user before
    -- any JWT/auth.uid() exists. Normal authenticated users remain fully
    -- subject to the owner policies below.

    -- drop any prior versions so re-running is idempotent
    execute format('drop policy if exists %I on public.%I;', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I;', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I;', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I;', t || '_delete_own', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = auth.uid());',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid());',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = auth.uid());',
      t || '_delete_own', t);
  end loop;
end $$;
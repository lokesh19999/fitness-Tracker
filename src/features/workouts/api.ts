import type { Tables, TablesInsert } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type WorkoutSession = Tables<'workout_sessions'>
export type WorkoutExercise = Tables<'workout_exercises'>
export type WorkoutSet = Tables<'workout_sets'>
export type WorkoutTemplate = Tables<'workout_templates'>
export type WorkoutTemplateExercise = Tables<'workout_template_exercises'>

export interface WorkoutSetInput {
  id?: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  completed: boolean
}

export interface WorkoutExerciseInput {
  id?: string
  exercise_name: string
  sort_order: number
  rir: number | null
  technique_notes: string | null
  symptoms: string | null
  completed: boolean
  sets: WorkoutSetInput[]
}

export interface WorkoutSessionFull {
  session: WorkoutSession
  exercises: WorkoutExerciseInput[]
}

export interface TemplateFull {
  template: WorkoutTemplate
  exercises: WorkoutTemplateExercise[]
}

export async function fetchTemplates(userId: string): Promise<TemplateFull[]> {
  const [templatesRes, exercisesRes] = await Promise.all([
    supabase.from('workout_templates').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('workout_template_exercises').select('*').eq('user_id', userId).order('sort_order'),
  ])
  if (templatesRes.error) throw new Error(templatesRes.error.message)
  if (exercisesRes.error) throw new Error(exercisesRes.error.message)
  const exercises = exercisesRes.data ?? []
  return (templatesRes.data ?? []).map((template) => ({
    template,
    exercises: exercises.filter((e) => e.template_id === template.id),
  }))
}

export async function saveTemplateExercise(
  userId: string,
  templateId: string,
  exercise: Omit<TablesInsert<'workout_template_exercises'>, 'user_id' | 'template_id'> & { id?: string },
) {
  if (exercise.id) {
    const { id, ...rest } = exercise
    const { error } = await supabase
      .from('workout_template_exercises')
      .update(rest)
      .eq('id', id)
    if (error) throw new Error(error.message)
    return
  }
  const { error } = await supabase
    .from('workout_template_exercises')
    .insert({ ...exercise, user_id: userId, template_id: templateId })
  if (error) throw new Error(error.message)
}

export async function deleteTemplateExercise(id: string) {
  const { error } = await supabase.from('workout_template_exercises').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchSessions(userId: string): Promise<WorkoutSessionFull[]> {
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
  if (error) throw new Error(error.message)
  if (!sessions || sessions.length === 0) return []

  const sessionIds = sessions.map((s) => s.id)
  const { data: exercises, error: exError } = await supabase
    .from('workout_exercises')
    .select('*')
    .in('session_id', sessionIds)
    .order('sort_order')
  if (exError) throw new Error(exError.message)

  const exerciseIds = (exercises ?? []).map((e) => e.id)
  const { data: sets, error: setError } =
    exerciseIds.length > 0
      ? await supabase.from('workout_sets').select('*').in('workout_exercise_id', exerciseIds).order('set_number')
      : { data: [] as WorkoutSet[], error: null }
  if (setError) throw new Error(setError.message)

  return sessions.map((session) => ({
    session,
    exercises: (exercises ?? [])
      .filter((e) => e.session_id === session.id)
      .map((e) => ({
        id: e.id,
        exercise_name: e.exercise_name,
        sort_order: e.sort_order,
        rir: e.rir,
        technique_notes: e.technique_notes,
        symptoms: e.symptoms,
        completed: e.completed,
        sets: (sets ?? [])
          .filter((s) => s.workout_exercise_id === e.id)
          .map((s) => ({
            id: s.id,
            set_number: s.set_number,
            weight_kg: s.weight_kg,
            reps: s.reps,
            completed: s.completed,
          })),
      })),
  }))
}

export async function createSession(
  userId: string,
  session: Omit<TablesInsert<'workout_sessions'>, 'user_id'>,
  exercises: Omit<WorkoutExerciseInput, 'id' | 'sets'>[] = [],
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({ ...session, user_id: userId })
    .select()
    .single()
  if (error) throw new Error(error.message)

  for (const [index, exercise] of exercises.entries()) {
    const { data: exRow, error: exError } = await supabase
      .from('workout_exercises')
      .insert({ ...exercise, user_id: userId, session_id: data.id, sort_order: index })
      .select()
      .single()
    if (exError) throw new Error(exError.message)
    const setRows = Array.from({ length: 4 }).map((_, i) => ({
      user_id: userId,
      workout_exercise_id: exRow.id,
      set_number: i + 1,
      weight_kg: null,
      reps: null,
      completed: false,
    }))
    const { error: setError } = await supabase.from('workout_sets').insert(setRows)
    if (setError) throw new Error(setError.message)
  }
  return data
}

export async function saveSessionDetails(session: WorkoutSession, exercises: WorkoutExerciseInput[]) {
  const { error: sessionError } = await supabase
    .from('workout_sessions')
    .update({
      session_label: session.session_label,
      focus: session.focus,
      status: session.status,
      week_number: session.week_number,
      technique_notes: session.technique_notes,
      symptoms: session.symptoms,
    })
    .eq('id', session.id)
  if (sessionError) throw new Error(sessionError.message)

  for (const [index, exercise] of exercises.entries()) {
    let exerciseId = exercise.id
    if (exerciseId) {
      const { error } = await supabase
        .from('workout_exercises')
        .update({
          exercise_name: exercise.exercise_name,
          sort_order: index,
          rir: exercise.rir,
          technique_notes: exercise.technique_notes,
          symptoms: exercise.symptoms,
          completed: exercise.completed,
        })
        .eq('id', exerciseId)
      if (error) throw new Error(error.message)
    } else {
      const { data, error } = await supabase
        .from('workout_exercises')
        .insert({
          user_id: session.user_id,
          session_id: session.id,
          exercise_name: exercise.exercise_name,
          sort_order: index,
          rir: exercise.rir,
          technique_notes: exercise.technique_notes,
          symptoms: exercise.symptoms,
          completed: exercise.completed,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      exerciseId = data.id
    }

    for (const set of exercise.sets) {
      if (set.id) {
        const { error } = await supabase
          .from('workout_sets')
          .update({
            set_number: set.set_number,
            weight_kg: set.weight_kg,
            reps: set.reps,
            completed: set.completed,
          })
          .eq('id', set.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.from('workout_sets').insert({
          user_id: session.user_id,
          workout_exercise_id: exerciseId!,
          set_number: set.set_number,
          weight_kg: set.weight_kg,
          reps: set.reps,
          completed: set.completed,
        })
        if (error) throw new Error(error.message)
      }
    }
  }
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('workout_sessions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateSessionStatus(id: string, status: WorkoutSession['status']): Promise<void> {
  const { error } = await supabase.from('workout_sessions').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}
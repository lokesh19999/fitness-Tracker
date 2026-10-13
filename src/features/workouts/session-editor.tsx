import { CheckCircle2, Loader2, Plus, Save, Trash2, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'

import {
  saveSessionDetails,
  updateSessionStatus,
  type WorkoutExerciseInput,
  type WorkoutSessionFull,
} from './api'
import { invalidateWorkouts } from './hooks'

function cloneExercises(session: WorkoutSessionFull): WorkoutExerciseInput[] {
  return session.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) }))
}

export function SessionEditor({
  session,
  allSessions,
  onClose,
  onSaved,
}: {
  session: WorkoutSessionFull
  allSessions: WorkoutSessionFull[]
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const { user } = useAuth()
  const [status, setStatus] = useState(session.session.status)
  const [sessionLabel, setSessionLabel] = useState(session.session.session_label)
  const [focus, setFocus] = useState(session.session.focus ?? '')
  const [techniqueNotes, setTechniqueNotes] = useState(session.session.technique_notes ?? '')
  const [symptoms, setSymptoms] = useState(session.session.symptoms ?? '')
  const [exercises, setExercises] = useState<WorkoutExerciseInput[]>(() => cloneExercises(session))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previousSession = useMemo(() => {
    const prior = allSessions
      .filter((s) => s.session.session_label === session.session.session_label && s.session.session_date < session.session.session_date)
      .sort((a, b) => b.session.session_date.localeCompare(a.session.session_date))[0]
    if (!prior) return null
    const map = new Map<string, string>()
    for (const ex of prior.exercises) {
      const top = ex.sets
        .filter((s) => typeof s.weight_kg === 'number')
        .sort((a, b) => (b.weight_kg ?? 0) - (a.weight_kg ?? 0))[0]
      if (top) map.set(ex.exercise_name, `${top.weight_kg}kg × ${top.reps ?? '—'}`)
    }
    return map
  }, [allSessions, session.session.session_label, session.session.session_date])

  function updateExercise(index: number, patch: Partial<WorkoutExerciseInput>) {
    setExercises((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }
  function updateSet(exIndex: number, setIndex: number, patch: Partial<WorkoutExerciseInput['sets'][number]>) {
    setExercises((prev) =>
      prev.map((e, i) =>
        i === exIndex ? { ...e, sets: e.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) } : e,
      ),
    )
  }
  function addSet(exIndex: number) {
    setExercises((prev) =>
      prev.map((e, i) =>
        i === exIndex
          ? { ...e, sets: [...e.sets, { set_number: e.sets.length + 1, weight_kg: null, reps: null, completed: false }] }
          : e,
      ),
    )
  }
  function removeSet(exIndex: number, setIndex: number) {
    setExercises((prev) =>
      prev.map((e, i) =>
        i === exIndex
          ? { ...e, sets: e.sets.filter((_, j) => j !== setIndex).map((s, j) => ({ ...s, set_number: j + 1 })) }
          : e,
      ),
    )
  }
  function addExercise() {
    setExercises((prev) => [
      ...prev,
      {
        exercise_name: 'New exercise',
        sort_order: prev.length,
        rir: null,
        technique_notes: null,
        symptoms: null,
        completed: false,
        sets: [1, 2, 3, 4].map((n) => ({ set_number: n, weight_kg: null, reps: null, completed: false })),
      },
    ])
  }
  function removeExercise(exIndex: number) {
    setExercises((prev) => prev.filter((_, i) => i !== exIndex))
  }

  async function persist(nextStatus = status) {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await saveSessionDetails(
        {
          ...session.session,
          status: nextStatus,
          session_label: sessionLabel,
          focus: focus || null,
          technique_notes: techniqueNotes || null,
          symptoms: symptoms || null,
        },
        exercises,
      )
      invalidateWorkouts(user.id)
      onSaved('Workout session saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function setAndPersist(nextStatus: typeof status) {
    if (!user) return
    setStatus(nextStatus)
    setSaving(true)
    setError(null)
    try {
      await updateSessionStatus(session.session.id, nextStatus)
      await saveSessionDetails(
        {
          ...session.session,
          status: nextStatus,
          session_label: sessionLabel,
          focus: focus || null,
          technique_notes: techniqueNotes || null,
          symptoms: symptoms || null,
        },
        exercises,
      )
      invalidateWorkouts(user.id)
      onSaved(`Session marked ${nextStatus}.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={status === 'completed' ? 'success' : status === 'skipped' ? 'destructive' : 'secondary'}
        >
          {status}
        </Badge>
        <Button size="sm" variant={status === 'completed' ? 'default' : 'outline'} onClick={() => void setAndPersist('completed')} disabled={saving}>
          <CheckCircle2 className="h-4 w-4" /> Complete
        </Button>
        <Button size="sm" variant="outline" onClick={() => void setAndPersist('planned')} disabled={saving}>
          Mark planned
        </Button>
        <Button size="sm" variant="outline" onClick={() => void setAndPersist('skipped')} disabled={saving}>
          <XCircle className="h-4 w-4" /> Skip
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Session</Label>
          <Input value={sessionLabel} onChange={(e) => setSessionLabel(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Focus</Label>
          <Input value={focus} onChange={(e) => setFocus(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        {exercises.map((exercise, exIndex) => (
          <div key={exIndex} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                aria-label={`Exercise ${exIndex + 1} name`}
                placeholder="Exercise name"
                className="h-9 basis-full min-w-0 sm:basis-auto sm:max-w-xs sm:flex-1"
                value={exercise.exercise_name}
                onChange={(e) => updateExercise(exIndex, { exercise_name: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Label className="text-xs">RIR</Label>
                <Input
                  type="number"
                  aria-label={`Exercise ${exIndex + 1} RIR`}
                  className="h-9 w-16 min-w-0"
                  value={exercise.rir ?? ''}
                  onChange={(e) => updateExercise(exIndex, { rir: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={exercise.completed}
                  onChange={(e) => updateExercise(exIndex, { completed: e.target.checked })}
                />
                Completed
              </label>
              <Button variant="ghost" size="icon" onClick={() => removeExercise(exIndex)} aria-label="Remove exercise" className="ml-auto sm:ml-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {previousSession?.get(exercise.exercise_name) ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Last time: {previousSession.get(exercise.exercise_name)}
              </p>
            ) : null}

            <div className="mt-2 space-y-1.5">
              <div className="hidden grid-cols-[2rem_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground sm:grid">
                <span>Set</span><span>Weight (kg)</span><span>Reps</span><span />
              </div>
              {exercise.sets.map((set, setIndex) => (
                <div
                  key={setIndex}
                  className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2 sm:grid-cols-[2rem_1fr_1fr_auto]"
                >
                  <span className="text-sm text-muted-foreground">{set.set_number}</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    aria-label={`Set ${set.set_number} weight (kg)`}
                    placeholder="kg"
                    className="h-9 min-w-0"
                    value={set.weight_kg ?? ''}
                    onChange={(e) => updateSet(exIndex, setIndex, { weight_kg: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    aria-label={`Set ${set.set_number} reps`}
                    placeholder="reps"
                    className="h-9 min-w-0"
                    value={set.reps ?? ''}
                    onChange={(e) => updateSet(exIndex, setIndex, { reps: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                  <div className="col-span-3 flex items-center gap-1 sm:col-span-1">
                    <input
                      type="checkbox"
                      aria-label={`Set ${set.set_number} completed`}
                      checked={set.completed}
                      onChange={(e) => updateSet(exIndex, setIndex, { completed: e.target.checked })}
                    />
                    <span className="text-xs text-muted-foreground sm:hidden">Completed</span>
                    <Button variant="ghost" size="icon" onClick={() => removeSet(exIndex, setIndex)} aria-label="Remove set">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addSet(exIndex)}>
                <Plus className="h-4 w-4" /> Add set
              </Button>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Textarea
                placeholder="Technique notes for this exercise"
                className="min-h-9 text-xs"
                value={exercise.technique_notes ?? ''}
                onChange={(e) => updateExercise(exIndex, { technique_notes: e.target.value || null })}
              />
              <Textarea
                placeholder="Symptoms / discomfort"
                className="min-h-9 text-xs"
                value={exercise.symptoms ?? ''}
                onChange={(e) => updateExercise(exIndex, { symptoms: e.target.value || null })}
              />
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addExercise}>
        <Plus className="h-4 w-4" /> Add exercise
      </Button>

      <Separator />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Session technique notes</Label>
          <Textarea value={techniqueNotes} onChange={(e) => setTechniqueNotes(e.target.value)} placeholder="Overall technique notes" />
        </div>
        <div className="space-y-1.5">
          <Label>Symptoms / discomfort</Label>
          <Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Any pain or discomfort" />
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button onClick={() => void persist()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save session
        </Button>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
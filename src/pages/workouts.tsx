import { CalendarPlus, Dumbbell, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { DAY_NAMES, formatDate, toISODate } from '@/utils/dates'
import {
  createSession,
  deleteSession,
  deleteTemplateExercise,
  saveTemplateExercise,
  type WorkoutSessionFull,
} from '@/features/workouts/api'
import { invalidateWorkouts, useWorkoutSessions, useWorkoutTemplates } from '@/features/workouts/hooks'
import { SessionEditor } from '@/features/workouts/session-editor'

export function WorkoutsPage() {
  const { user } = useAuth()
  const sessionsQ = useWorkoutSessions()
  const templatesQ = useWorkoutTemplates()
  const [message, setMessage] = useState<string | null>(null)
  const [editorSession, setEditorSession] = useState<WorkoutSessionFull | null>(null)
  const [deleting, setDeleting] = useState<WorkoutSessionFull | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newDate, setNewDate] = useState(toISODate(new Date()))
  const [newTemplateId, setNewTemplateId] = useState('blank')
  const [creating, setCreating] = useState(false)

  const sortedTemplates = useMemo(
    () => [...templatesQ.templates].sort((a, b) => a.template.sort_order - b.template.sort_order),
    [templatesQ.templates],
  )

  async function handleCreate() {
    if (!user) return
    setCreating(true)
    try {
      const template = templatesQ.templates.find((t) => t.template.id === newTemplateId)
      await createSession(
        user.id,
        {
          session_date: newDate,
          session_label: template?.template.session_label ?? 'Custom session',
          focus: template?.template.focus ?? null,
          status: 'planned',
          week_number: null,
        },
        (template?.exercises ?? []).map((e) => ({
          exercise_name: e.exercise_name,
          sort_order: e.sort_order,
          rir: e.target_rir,
          technique_notes: null,
          symptoms: null,
          completed: false,
        })),
      )
      invalidateWorkouts(user.id)
      setMessage('Workout session created (planned). Mark exercises complete as you train.')
      setNewOpen(false)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not create session.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleting || !user) return
    try {
      await deleteSession(deleting.session.id)
      invalidateWorkouts(user.id)
      setMessage('Session deleted.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Delete failed.')
    }
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-lg border bg-accent/40 px-4 py-2 text-sm text-accent-foreground">{message}</div> : null}

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log">Training log</TabsTrigger>
          <TabsTrigger value="templates">Weekly plan</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={newOpen} onOpenChange={setNewOpen}>
              <DialogTrigger asChild>
                <Button><CalendarPlus className="h-4 w-4" /> New session</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>New workout session</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Template</Label>
                    <Select value={newTemplateId} onValueChange={setNewTemplateId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blank">Blank session</SelectItem>
                        {sortedTemplates.filter((t) => !t.template.is_rest).map((t) => (
                          <SelectItem key={t.template.id} value={t.template.id}>{t.template.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sessions are created as <strong>planned</strong>. They are never auto-marked complete.
                  </p>
                  <Button onClick={() => void handleCreate()} disabled={creating}>Create session</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {sessionsQ.error ? <ErrorState message={sessionsQ.error} onRetry={sessionsQ.refetch} /> : null}
          {sessionsQ.loading ? <LoadingState /> : null}
          {!sessionsQ.loading && sessionsQ.sessions.length === 0 ? (
            <EmptyState
              icon={<Dumbbell className="h-8 w-8" />}
              title="No workouts logged yet"
              description="Create a session from your weekly plan, then log the weight and reps for each set."
            />
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sessionsQ.sessions.map((s) => (
              <Card key={s.session.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-sm">{s.session.session_label}</CardTitle>
                    <p className="text-xs text-muted-foreground">{formatDate(s.session.session_date)} · {DAY_NAMES[new Date(s.session.session_date + 'T00:00:00').getDay()]}</p>
                  </div>
                  <Badge variant={s.session.status === 'completed' ? 'success' : s.session.status === 'skipped' ? 'destructive' : 'secondary'}>
                    {s.session.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">{s.exercises.length} exercise(s)</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditorSession(s)}>Open</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(s)} aria-label="Delete session">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templatesQ.loading ? <LoadingState /> : null}
          {sortedTemplates.map((t) => (
            <Card key={t.template.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t.template.name}</CardTitle>
                {t.template.focus ? <p className="text-xs text-muted-foreground">Focus: {t.template.focus}</p> : null}
                {t.template.is_rest ? <Badge variant="secondary">Rest day</Badge> : null}
              </CardHeader>
              <CardContent className="space-y-2">
                {t.exercises.map((exercise) => (
                  <TemplateExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    onSaved={(msg) => setMessage(msg)}
                  />
                ))}
                <AddTemplateExercise templateId={t.template.id} onSaved={(msg) => setMessage(msg)} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(editorSession)} onOpenChange={(open) => !open && setEditorSession(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Edit workout session</DialogTitle></DialogHeader>
          {editorSession ? (
            <SessionEditor
              session={editorSession}
              allSessions={sessionsQ.sessions}
              onClose={() => setEditorSession(null)}
              onSaved={(msg) => { setMessage(msg); setEditorSession(null) }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete this session?"
        description="The session and all its logged sets will be removed from the cloud."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}

function TemplateExerciseRow({
  exercise,
  onSaved,
}: {
  exercise: { id: string; exercise_name: string; default_sets: number; default_reps: string | null; target_rir: number | null }
  onSaved: (message: string) => void
}) {
  const { user } = useAuth()
  const [name, setName] = useState(exercise.exercise_name)
  const [sets, setSets] = useState(String(exercise.default_sets))
  const [reps, setReps] = useState(exercise.default_reps ?? '')
  const [rir, setRir] = useState(exercise.target_rir === null ? '' : String(exercise.target_rir))

  async function save() {
    if (!user) return
    try {
      await saveTemplateExercise(user.id, '', {
        id: exercise.id,
        exercise_name: name,
        default_sets: Number(sets) || 4,
        default_reps: reps || null,
        target_rir: rir === '' ? null : Number(rir),
      })
      invalidateWorkouts(user.id)
      onSaved('Template updated.')
    } catch (e) {
      onSaved(e instanceof Error ? e.message : 'Update failed.')
    }
  }

  async function remove() {
    if (!user) return
    try {
      await deleteTemplateExercise(exercise.id)
      invalidateWorkouts(user.id)
      onSaved('Exercise removed from template.')
    } catch (e) {
      onSaved(e instanceof Error ? e.message : 'Delete failed.')
    }
  }

  return (
    <div className="grid grid-cols-[1fr_4rem_5rem_4rem_auto] items-center gap-2">
      <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => void save()} />
      <Input className="h-9" type="number" value={sets} onChange={(e) => setSets(e.target.value)} onBlur={() => void save()} />
      <Input className="h-9" value={reps} placeholder="reps" onChange={(e) => setReps(e.target.value)} onBlur={() => void save()} />
      <Input className="h-9" type="number" value={rir} placeholder="RIR" onChange={(e) => setRir(e.target.value)} onBlur={() => void save()} />
      <Button variant="ghost" size="icon" onClick={() => void remove()} aria-label="Remove exercise">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}

function AddTemplateExercise({ templateId, onSaved }: { templateId: string; onSaved: (message: string) => void }) {
  const { user } = useAuth()
  const [name, setName] = useState('')

  async function add() {
    if (!user || !name.trim()) return
    try {
      await saveTemplateExercise(user.id, templateId, {
        exercise_name: name.trim(),
        default_sets: 4,
        default_reps: '8-10',
        target_rir: 2,
        sort_order: 999,
      })
      invalidateWorkouts(user.id)
      setName('')
      onSaved('Exercise added to template.')
    } catch (e) {
      onSaved(e instanceof Error ? e.message : 'Add failed.')
    }
  }

  return (
    <div className="flex gap-2">
      <Input className="h-9" placeholder="Add custom exercise…" value={name} onChange={(e) => setName(e.target.value)} />
      <Button size="sm" variant="outline" onClick={() => void add()}>
        <Plus className="h-4 w-4" /> Add
      </Button>
    </div>
  )
}
import { Loader2, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useDailyLogs } from '@/features/daily-log/hooks'
import { useSettings } from '@/features/settings/hooks'
import { useWorkoutSessions } from '@/features/workouts/hooks'
import { computeWeek, mergeWeekly, type WeekComputed } from '@/features/weekly-progress/compute'
import { saveWeeklyProgress, type WeeklyProgress } from '@/features/weekly-progress/api'
import { invalidateWeeklyProgress, useWeeklyProgress } from '@/features/weekly-progress/hooks'
import { formatDate } from '@/utils/dates'

const val = (v: number | null | undefined, digits = 1, unit = '') =>
  v === null || v === undefined ? '—' : `${Number(v).toFixed(digits)}${unit}`

export function WeeklyProgressPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const logsQ = useDailyLogs()
  const sessionsQ = useWorkoutSessions()
  const weeklyQ = useWeeklyProgress()
  const [editing, setEditing] = useState<{ computed: WeekComputed; manual?: WeeklyProgress } | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    week_start: '', waist_cm: '', hip_cm: '', hip_thrust_kg: '', core_benchmark: '',
    energy_face_rating: '', avg_weight_kg: '', avg_daily_steps: '', avg_sleep_hours: '',
    nutrition_adherence_pct: '', notes: '',
  })
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})

  const rows = useMemo(() => {
    const computed = Array.from({ length: 12 }).map((_, i) =>
      computeWeek(i + 1, settings.programme_start_date, logsQ.logs, sessionsQ.sessions, settings),
    )
    return computed.map((c) => mergeWeekly(c, weeklyQ.weekly.find((w) => w.week_number === c.weekNumber)))
  }, [settings, logsQ.logs, sessionsQ.sessions, weeklyQ.weekly])

  function openEdit(computed: WeekComputed, manual?: WeeklyProgress) {
    setEditing({ computed, manual })
    setForm({
      week_start: manual?.week_start ?? computed.weekStart,
      waist_cm: manual?.waist_cm === null || manual?.waist_cm === undefined ? '' : String(manual.waist_cm),
      hip_cm: manual?.hip_cm === null || manual?.hip_cm === undefined ? '' : String(manual.hip_cm),
      hip_thrust_kg: manual?.hip_thrust_kg === null || manual?.hip_thrust_kg === undefined ? '' : String(manual.hip_thrust_kg),
      core_benchmark: manual?.core_benchmark ?? '',
      energy_face_rating: manual?.energy_face_rating === null || manual?.energy_face_rating === undefined ? '' : String(manual.energy_face_rating),
      avg_weight_kg: manual?.avg_weight_kg === null || manual?.avg_weight_kg === undefined ? '' : String(manual.avg_weight_kg),
      avg_daily_steps: manual?.avg_daily_steps === null || manual?.avg_daily_steps === undefined ? '' : String(manual.avg_daily_steps),
      avg_sleep_hours: manual?.avg_sleep_hours === null || manual?.avg_sleep_hours === undefined ? '' : String(manual.avg_sleep_hours),
      nutrition_adherence_pct: manual?.nutrition_adherence_pct === null || manual?.nutrition_adherence_pct === undefined ? '' : String(manual.nutrition_adherence_pct),
      notes: manual?.notes ?? '',
    })
    const mf = new Set(manual?.manual_fields ?? [])
    setOverrides({
      avg_weight_kg: mf.has('avg_weight_kg'),
      avg_daily_steps: mf.has('avg_daily_steps'),
      avg_sleep_hours: mf.has('avg_sleep_hours'),
      nutrition_adherence_pct: mf.has('nutrition_adherence_pct'),
    })
  }

  const n = (v: string) => (v === '' ? null : Number(v))

  async function save() {
    if (!user || !editing) return
    setSaving(true)
    try {
      const manual_fields: string[] = []
      if (overrides.avg_weight_kg) manual_fields.push('avg_weight_kg')
      if (overrides.avg_daily_steps) manual_fields.push('avg_daily_steps')
      if (overrides.avg_sleep_hours) manual_fields.push('avg_sleep_hours')
      if (overrides.nutrition_adherence_pct) manual_fields.push('nutrition_adherence_pct')

      await saveWeeklyProgress(user.id, editing.computed.weekNumber, form.week_start, {
        id: editing.manual?.id,
        week_start: form.week_start,
        avg_weight_kg: overrides.avg_weight_kg ? n(form.avg_weight_kg) : null,
        waist_cm: n(form.waist_cm),
        hip_cm: n(form.hip_cm),
        hip_thrust_kg: n(form.hip_thrust_kg),
        core_benchmark: form.core_benchmark || null,
        avg_daily_steps: overrides.avg_daily_steps ? n(form.avg_daily_steps) : null,
        nutrition_adherence_pct: overrides.nutrition_adherence_pct ? n(form.nutrition_adherence_pct) : null,
        avg_sleep_hours: overrides.avg_sleep_hours ? n(form.avg_sleep_hours) : null,
        energy_face_rating: n(form.energy_face_rating),
        manual_fields,
        notes: form.notes || null,
      })
      invalidateWeeklyProgress(user.id)
      setMessage(`Week ${editing.computed.weekNumber} saved.`)
      setEditing(null)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        12-week tracker. Averages are calculated from your daily logs; measurements are manual. Values marked
        <Badge variant="secondary" className="mx-1">calculated</Badge> come from your records, others are manual.
      </p>
      {message ? <div className="rounded-lg border bg-accent/40 px-4 py-2 text-sm text-accent-foreground">{message}</div> : null}

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <Card key={row.weekNumber}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Week {row.weekNumber}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => openEdit(row.computed, row.manualRow ?? undefined)} aria-label="Edit week"><Pencil className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Avg weight:</span> {val(row.avgWeight, 2, ' kg')}</div>
              <div><span className="text-muted-foreground">Waist:</span> {val(row.waist, 1, ' cm')}</div>
              <div><span className="text-muted-foreground">Hip:</span> {val(row.hip, 1, ' cm')}</div>
              <div><span className="text-muted-foreground">Hip thrust:</span> {val(row.hipThrust, 1, ' kg')}</div>
              <div><span className="text-muted-foreground">Steps:</span> {val(row.avgSteps, 0)}</div>
              <div><span className="text-muted-foreground">Sleep:</span> {val(row.avgSleep, 1, ' h')}</div>
              <div><span className="text-muted-foreground">Workouts:</span> {row.workoutsCompleted}/{row.workoutsPlanned}</div>
              <div><span className="text-muted-foreground">Nutrition:</span> {val(row.nutritionAdherencePct, 0, '%')}</div>
              <div className="col-span-2"><span className="text-muted-foreground">Core:</span> {row.coreBenchmark ?? '—'}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden lg:block">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Avg weight</TableHead>
                <TableHead>Waist</TableHead>
                <TableHead>Hip</TableHead>
                <TableHead>Hip thrust</TableHead>
                <TableHead>Core</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>Workouts</TableHead>
                <TableHead>Nutrition</TableHead>
                <TableHead>Sleep</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.weekNumber}>
                  <TableCell className="font-medium">{row.weekNumber}</TableCell>
                  <TableCell>{formatDate(row.weekStart)}</TableCell>
                  <TableCell>{val(row.avgWeight, 2)}</TableCell>
                  <TableCell>{val(row.waist, 1)}</TableCell>
                  <TableCell>{val(row.hip, 1)}</TableCell>
                  <TableCell>{val(row.hipThrust, 1)}</TableCell>
                  <TableCell className="max-w-40 truncate">{row.coreBenchmark ?? '—'}</TableCell>
                  <TableCell>{val(row.avgSteps, 0)}</TableCell>
                  <TableCell>{row.workoutsCompleted}/{row.workoutsPlanned}</TableCell>
                  <TableCell>{val(row.nutritionAdherencePct, 0, '%')}</TableCell>
                  <TableCell>{val(row.avgSleep, 1)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row.computed, row.manualRow ?? undefined)} aria-label="Edit week"><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Week {editing?.computed.weekNumber} details</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Week start</Label>
              <Input type="date" value={form.week_start} onChange={(e) => setForm({ ...form, week_start: e.target.value })} />
            </div>
            <div className="space-y-1.5"><Label>Waist (cm)</Label><Input type="number" step="0.1" value={form.waist_cm} onChange={(e) => setForm({ ...form, waist_cm: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Hip (cm)</Label><Input type="number" step="0.1" value={form.hip_cm} onChange={(e) => setForm({ ...form, hip_cm: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Hip thrust load (kg)</Label><Input type="number" step="0.5" value={form.hip_thrust_kg} onChange={(e) => setForm({ ...form, hip_thrust_kg: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Energy/face rating</Label><Input type="number" step="0.1" value={form.energy_face_rating} onChange={(e) => setForm({ ...form, energy_face_rating: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Core benchmark</Label><Input placeholder="e.g. 60s plank, 12 dead bugs" value={form.core_benchmark} onChange={(e) => setForm({ ...form, core_benchmark: e.target.value })} /></div>

            {([
              ['avg_weight_kg', 'Avg weight', '2'],
              ['avg_daily_steps', 'Avg daily steps', '0'],
              ['avg_sleep_hours', 'Avg sleep (h)', '1'],
              ['nutrition_adherence_pct', 'Nutrition adherence (%)', '0'],
            ] as const).map(([key, label, step]) => (
              <div key={key} className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={overrides[key] ?? false} onChange={(e) => setOverrides({ ...overrides, [key]: e.target.checked })} />
                  Override {label}
                </label>
                <Input type="number" step={step} disabled={!overrides[key]} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}

            <div className="space-y-1.5 sm:col-span-2"><Label>Notes & adjustments</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save week</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
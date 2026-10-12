import { ImagePlus, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MeasurementsChart } from '@/features/dashboard/charts'
import {
  deleteMeasurement,
  deletePhoto,
  getPhotoUrl,
  saveMeasurement,
  uploadPhoto,
  type BodyMeasurement,
} from '@/features/measurements/api'
import { invalidateMeasurements, useMeasurements } from '@/features/measurements/hooks'
import { measurementSchema, normalizeMeasurement } from '@/features/measurements/schema'
import { formatDate, toISODate } from '@/utils/dates'

const num = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v))

function PhotoThumb({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    void getPhotoUrl(path).then((u) => active && setUrl(u))
    return () => {
      active = false
    }
  }, [path])
  if (!url) return <div className="h-16 w-16 animate-pulse rounded bg-muted" />
  return <img src={url} alt="Progress" className="h-16 w-16 rounded object-cover" />
}

export function MeasurementsPage() {
  const { user } = useAuth()
  const { measurements, loading, error, refetch } = useMeasurements()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BodyMeasurement | null>(null)
  const [deleting, setDeleting] = useState<BodyMeasurement | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [form, setForm] = useState({
    measured_on: toISODate(new Date()),
    weight_kg: '', waist_cm: '', hip_cm: '', chest_cm: '', thigh_cm: '', arm_cm: '', notes: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const asc = useMemo(
    () => [...measurements].sort((a, b) => a.measured_on.localeCompare(b.measured_on)),
    [measurements],
  )

  function openNew() {
    setEditing(null)
    setFile(null)
    setErrors({})
    setForm({ measured_on: toISODate(new Date()), weight_kg: '', waist_cm: '', hip_cm: '', chest_cm: '', thigh_cm: '', arm_cm: '', notes: '' })
    setOpen(true)
  }
  function openEdit(m: BodyMeasurement) {
    setEditing(m)
    setFile(null)
    setErrors({})
    setForm({
      measured_on: m.measured_on,
      weight_kg: num(m.weight_kg),
      waist_cm: num(m.waist_cm),
      hip_cm: num(m.hip_cm),
      chest_cm: num(m.chest_cm),
      thigh_cm: num(m.thigh_cm),
      arm_cm: num(m.arm_cm),
      notes: m.notes ?? '',
    })
    setOpen(true)
  }

  async function submit() {
    if (!user) return
    const parsed = measurementSchema.safeParse(form)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message
      setErrors(fieldErrors)
      return
    }
    setSaving(true)
    try {
      let photo_path = editing?.photo_path ?? null
      if (file) photo_path = await uploadPhoto(user.id, file)
      await saveMeasurement(user.id, { ...normalizeMeasurement(parsed.data), id: editing?.id, photo_path })
      invalidateMeasurements(user.id)
      setMessage(editing ? 'Measurement updated.' : 'Measurement saved.')
      setOpen(false)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting || !user) return
    try {
      if (deleting.photo_path) await deletePhoto(deleting.photo_path).catch(() => undefined)
      await deleteMeasurement(deleting.id)
      invalidateMeasurements(user.id)
      setMessage('Measurement deleted.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Delete failed.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{measurements.length} records</p>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add measurement</Button>
      </div>

      {message ? <div className="rounded-lg border bg-accent/40 px-4 py-2 text-sm text-accent-foreground">{message}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <MeasurementsChart data={asc.map((m) => ({ date: m.measured_on, waist: m.waist_cm, hip: m.hip_cm }))} />
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Weight trend (kg)</CardTitle></CardHeader>
          <CardContent className="h-64 pl-0">
            {asc.filter((m) => m.weight_kg !== null).length === 0 ? (
              <div className="flex h-full items-center justify-center"><EmptyState title="No weight measurements" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={asc.map((m) => ({ date: m.measured_on, weight: m.weight_kg }))} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => formatDate(v, { month: 'short', day: 'numeric' })} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="weight" stroke="var(--chart-1)" strokeWidth={2} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Measurement history</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {error ? <ErrorState message={error} onRetry={refetch} /> : null}
          {loading ? <LoadingState /> : null}
          {!loading && measurements.length === 0 ? <EmptyState title="No measurements yet" description="Track weight, waist and hips over time." /> : null}
          {measurements.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                {m.photo_path ? <PhotoThumb path={m.photo_path} /> : null}
                <div>
                  <p className="font-medium">{formatDate(m.measured_on)}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.weight_kg !== null ? `${m.weight_kg} kg · ` : ''}
                    {m.waist_cm !== null ? `waist ${m.waist_cm} cm · ` : ''}
                    {m.hip_cm !== null ? `hip ${m.hip_cm} cm` : ''}
                  </p>
                  {m.notes ? <p className="mt-0.5 text-xs text-muted-foreground">{m.notes}</p> : null}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(m)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(m)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit measurement' : 'Add measurement'}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Date</Label>
              <Input type="date" value={form.measured_on} onChange={(e) => setForm({ ...form, measured_on: e.target.value })} />
              {errors.measured_on ? <p className="text-xs text-destructive">{errors.measured_on}</p> : null}
            </div>
            {([
              ['weight_kg', 'Weight (kg)'], ['waist_cm', 'Waist (cm)'], ['hip_cm', 'Hip (cm)'],
              ['chest_cm', 'Chest (cm)'], ['thigh_cm', 'Thigh (cm)'], ['arm_cm', 'Arm (cm)'],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input type="number" inputMode="decimal" step="0.1" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                {errors[key] ? <p className="text-xs text-destructive">{errors[key]}</p> : null}
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Progress photo (private)</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Stored privately in Supabase Storage. Only you can access it.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete this measurement?"
        description="This also removes any attached photo from private storage."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
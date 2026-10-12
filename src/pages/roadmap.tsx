import { CheckCircle2, CircleDashed, Loader2, Pencil } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useSettings } from '@/features/settings/hooks'
import { saveRoadmapWeek, type RoadmapWeek } from '@/features/roadmap/api'
import { invalidateRoadmap, useRoadmap } from '@/features/roadmap/hooks'
import { programmeWeek, toISODate } from '@/utils/dates'
import { cn } from '@/utils/cn'

export function RoadmapPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { roadmap, loading } = useRoadmap()
  const [editing, setEditing] = useState<RoadmapWeek | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    focus: '', training_goals: '', nutrition_goals: '', review_checkpoint: '', status: 'not_started', notes: '',
  })

  const currentWeek = programmeWeek(settings.programme_start_date, toISODate(new Date()))

  function openEdit(week: RoadmapWeek) {
    setEditing(week)
    setForm({
      focus: week.focus ?? '',
      training_goals: week.training_goals ?? '',
      nutrition_goals: week.nutrition_goals ?? '',
      review_checkpoint: week.review_checkpoint ?? '',
      status: week.status,
      notes: week.notes ?? '',
    })
  }

  async function save() {
    if (!user || !editing) return
    setSaving(true)
    try {
      await saveRoadmapWeek(user.id, {
        id: editing.id,
        week_number: editing.week_number,
        focus: form.focus || null,
        training_goals: form.training_goals || null,
        nutrition_goals: form.nutrition_goals || null,
        review_checkpoint: form.review_checkpoint || null,
        status: form.status as RoadmapWeek['status'],
        notes: form.notes || null,
      })
      invalidateRoadmap(user.id)
      setMessage(`Week ${editing.week_number} roadmap updated.`)
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
        Current programme week: <span className="font-semibold text-foreground">{currentWeek >= 1 && currentWeek <= 12 ? currentWeek : currentWeek < 1 ? 'not started' : 'complete'}</span>.
        Start date is configurable in Settings.
      </p>
      {message ? <div className="rounded-lg border bg-accent/40 px-4 py-2 text-sm text-accent-foreground">{message}</div> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading roadmap…</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {roadmap.map((week) => {
          const isCurrent = week.week_number === currentWeek
          return (
            <Card key={week.id} className={cn(isCurrent && 'ring-2 ring-primary')}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div>
                  <CardTitle className="text-sm">Week {week.week_number}{isCurrent ? ' · Current' : ''}</CardTitle>
                  <p className="text-xs text-muted-foreground">{week.focus ?? '—'}</p>
                </div>
                <Badge variant={week.status === 'completed' ? 'success' : week.status === 'in_progress' ? 'secondary' : 'outline'}>
                  {week.status === 'completed' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <CircleDashed className="mr-1 h-3 w-3" />}
                  {week.status.replace('_', ' ')}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {week.training_goals ? <p><span className="font-medium">Training:</span> {week.training_goals}</p> : null}
                {week.nutrition_goals ? <p><span className="font-medium">Nutrition:</span> {week.nutrition_goals}</p> : null}
                {week.review_checkpoint ? <p className="text-muted-foreground"><span className="font-medium">Checkpoint:</span> {week.review_checkpoint}</p> : null}
                <Button size="sm" variant="outline" onClick={() => openEdit(week)}><Pencil className="h-4 w-4" /> Edit</Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Edit week {editing?.week_number}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Weekly focus</Label><Textarea value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Training goals</Label><Textarea value={form.training_goals} onChange={(e) => setForm({ ...form, training_goals: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Nutrition / activity goals</Label><Textarea value={form.nutrition_goals} onChange={(e) => setForm({ ...form, nutrition_goals: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Review checkpoint</Label><Textarea value={form.review_checkpoint} onChange={(e) => setForm({ ...form, review_checkpoint: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not started</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
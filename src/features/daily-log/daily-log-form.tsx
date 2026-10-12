import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useOnline } from '@/hooks/use-online'
import { enqueueMutation, saveDraft } from '@/lib/offline'
import { DAY_NAMES, parseISODate, toISODate } from '@/utils/dates'

import { saveDailyLog, type DailyLog } from './api'
import { invalidateDailyLogs } from './hooks'
import { dailyLogSchema, normalizeDailyLog, type DailyLogValues } from './schema'

const emptyValues = (date: string): DailyLogValues => ({
  log_date: date,
  day_name: DAY_NAMES[parseISODate(date).getDay()],
  morning_weight_kg: '',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
  steps: '',
  workout_completed: false,
  water_l: '',
  sleep_hours: '',
  energy_rating: '',
  face_skin_rating: '',
  notes: '',
})

function toFormValues(log: DailyLog): DailyLogValues {
  return {
    log_date: log.log_date,
    day_name: log.day_name ?? DAY_NAMES[parseISODate(log.log_date).getDay()],
    morning_weight_kg: log.morning_weight_kg === null ? '' : String(log.morning_weight_kg),
    calories: log.calories === null ? '' : String(log.calories),
    protein_g: log.protein_g === null ? '' : String(log.protein_g),
    carbs_g: log.carbs_g === null ? '' : String(log.carbs_g),
    fat_g: log.fat_g === null ? '' : String(log.fat_g),
    steps: log.steps === null ? '' : String(log.steps),
    workout_completed: log.workout_completed,
    water_l: log.water_l === null ? '' : String(log.water_l),
    sleep_hours: log.sleep_hours === null ? '' : String(log.sleep_hours),
    energy_rating: log.energy_rating === null ? '' : String(log.energy_rating),
    face_skin_rating: log.face_skin_rating === null ? '' : String(log.face_skin_rating),
    notes: log.notes ?? '',
  }
}

export function DailyLogForm({
  editing,
  onSaved,
  onCancel,
}: {
  editing?: DailyLog | null
  onSaved?: (message: string) => void
  onCancel?: () => void
}) {
  const { user } = useAuth()
  const online = useOnline()
  const today = toISODate(new Date())

  const form = useForm<DailyLogValues>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: editing ? toFormValues(editing) : emptyValues(today),
  })

  useEffect(() => {
    form.reset(editing ? toFormValues(editing) : emptyValues(today))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const logDate = form.watch('log_date')

  async function onSubmit(values: DailyLogValues) {
    if (!user) return
    const dayName = DAY_NAMES[parseISODate(values.log_date).getDay()]
    const normalized = normalizeDailyLog(values)
    const payload = { ...normalized, day_name: dayName, user_id: user.id }

    if (!online) {
      await saveDraft({ key: `daily_log:${values.log_date}`, table: 'daily_logs', payload, userId: user.id })
      await enqueueMutation({
        table: 'daily_logs',
        op: editing ? 'update' : 'insert',
        payload: editing ? { ...payload, id: editing.id } : payload,
        userId: user.id,
        baseline: editing ? new Date(editing.updated_at).getTime() : 0,
      })
      onSaved?.('Saved on this device. It will sync to the cloud when you reconnect.')
      form.reset(emptyValues(values.log_date))
      return
    }

    try {
      await saveDailyLog(user.id, { ...normalized, day_name: dayName })
      invalidateDailyLogs(user.id)
      onSaved?.(editing ? 'Daily entry updated in the cloud.' : 'Daily entry saved to the cloud.')
      form.reset(emptyValues(values.log_date))
    } catch (e) {
      form.setError('root', { message: e instanceof Error ? e.message : 'Failed to save. Try again.' })
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="log_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" max={today} {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Day</FormLabel>
            <FormControl>
              <Input readOnly value={DAY_NAMES[parseISODate(logDate || today).getDay()]} />
            </FormControl>
          </FormItem>

          <FormField control={form.control} name="morning_weight_kg" render={({ field }) => (
            <FormItem>
              <FormLabel>Morning weight (kg)</FormLabel>
              <FormControl><Input type="number" inputMode="decimal" step="0.1" placeholder="e.g. 68.4" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="calories" render={({ field }) => (
            <FormItem>
              <FormLabel>Calories (kcal)</FormLabel>
              <FormControl><Input type="number" inputMode="numeric" step="1" placeholder="e.g. 2050" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="protein_g" render={({ field }) => (
            <FormItem>
              <FormLabel>Protein (g)</FormLabel>
              <FormControl><Input type="number" inputMode="decimal" step="1" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="carbs_g" render={({ field }) => (
            <FormItem>
              <FormLabel>Carbohydrates (g)</FormLabel>
              <FormControl><Input type="number" inputMode="decimal" step="1" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="fat_g" render={({ field }) => (
            <FormItem>
              <FormLabel>Fat (g)</FormLabel>
              <FormControl><Input type="number" inputMode="decimal" step="1" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="steps" render={({ field }) => (
            <FormItem>
              <FormLabel>Steps</FormLabel>
              <FormControl><Input type="number" inputMode="numeric" step="100" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="water_l" render={({ field }) => (
            <FormItem>
              <FormLabel>Water intake (L)</FormLabel>
              <FormControl><Input type="number" inputMode="decimal" step="0.1" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="sleep_hours" render={({ field }) => (
            <FormItem>
              <FormLabel>Sleep duration (hours)</FormLabel>
              <FormControl><Input type="number" inputMode="decimal" step="0.5" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="energy_rating" render={({ field }) => (
            <FormItem>
              <FormLabel>Energy rating (1–5)</FormLabel>
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="face_skin_rating" render={({ field }) => (
            <FormItem>
              <FormLabel>Face/skin appearance (1–5)</FormLabel>
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="workout_completed" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:col-span-2">
              <div>
                <FormLabel>Workout completed</FormLabel>
                <p className="text-xs text-muted-foreground">Tick only when the session was actually completed.</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl><Textarea placeholder="How did today go?" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {form.formState.errors.root ? (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editing ? 'Update entry' : 'Save entry'}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  )
}
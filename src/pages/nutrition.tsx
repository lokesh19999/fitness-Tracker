import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import { useSettings } from '@/features/settings/hooks'
import { deleteMeal, type MealEntry } from '@/features/nutrition/api'
import { invalidateMeals, useMeals } from '@/features/nutrition/hooks'
import { MealForm } from '@/features/nutrition/meal-form'
import { mealTotals, percentOfTarget } from '@/utils/calculations'
import { addDays, formatDate, toISODate } from '@/utils/dates'

function MacroBar({ label, actual, target, unit }: { label: string; actual: number | null; target: number; unit: string }) {
  const pct = percentOfTarget(actual, target) ?? 0
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {actual === null ? '—' : Math.round(actual * 10) / 10} / {target} {unit}
        </span>
      </div>
      <Progress value={Math.min(100, pct)} />
    </div>
  )
}

export function NutritionPage() {
  const { user } = useAuth()
  const { meals, loading, error, refetch } = useMeals()
  const { settings } = useSettings()
  const [date, setDate] = useState(toISODate(new Date()))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MealEntry | null>(null)
  const [deleting, setDeleting] = useState<MealEntry | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const dayMeals = useMemo(() => meals.filter((m) => m.log_date === date), [meals, date])
  const totals = useMemo(() => mealTotals(dayMeals), [dayMeals])

  function shiftDay(delta: number) {
    setDate(toISODate(addDays(new Date(date + 'T00:00:00'), delta)))
  }

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deleting || !user) return
    try {
      await deleteMeal(deleting.id)
      invalidateMeals(user.id)
      setMessage('Meal deleted.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Delete failed.')
    }
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-lg border bg-accent/40 px-4 py-2 text-sm text-accent-foreground">{message}</div> : null}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => shiftDay(-1)} aria-label="Previous day"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => shiftDay(1)} aria-label="Next day"><ChevronRight className="h-4 w-4" /></Button>
          <span className="ml-1 text-sm font-medium">{formatDate(date)}</span>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add meal</Button>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Day totals vs targets</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MacroBar label="Calories" actual={totals.calories} target={settings.target_calories} unit="kcal" />
          <MacroBar label="Protein" actual={totals.protein_g} target={settings.target_protein_g} unit="g" />
          <MacroBar label="Carbs" actual={totals.carbs_g} target={settings.target_carbs_g} unit="g" />
          <MacroBar label="Fat" actual={totals.fat_g} target={settings.target_fat_g} unit="g" />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Meal entries are the authoritative source for a day. Manual daily totals entered in the Daily Log are only used
        when no meals are logged for that date — the two are never added together.
      </p>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Meals on {formatDate(date)}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {error ? <ErrorState message={error} onRetry={refetch} /> : null}
          {loading ? <LoadingState /> : null}
          {!loading && dayMeals.length === 0 ? (
            <EmptyState title="No meals logged for this day" description="Add meals to track calories and macros." action={<Button className="mt-2" onClick={openNew}><Plus className="h-4 w-4" /> Add meal</Button>} />
          ) : null}

          {dayMeals.map((meal) => (
            <div key={meal.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">{meal.meal_type}</p>
                <p className="truncate font-medium">{meal.food}{meal.portion ? ` · ${meal.portion}` : ''}</p>
                <p className="text-xs text-muted-foreground">
                  {meal.calories ?? '—'} kcal · {meal.protein_g ?? '—'}P / {meal.carbs_g ?? '—'}C / {meal.fat_g ?? '—'}F
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditing(meal); setFormOpen(true) }} aria-label="Edit meal"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(meal)} aria-label="Delete meal"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit meal' : 'Add meal'}</DialogTitle></DialogHeader>
          <MealForm date={date} editing={editing} onSaved={(msg) => { setMessage(msg); setFormOpen(false) }} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete this meal?"
        description="It will be removed from the cloud on all your devices."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
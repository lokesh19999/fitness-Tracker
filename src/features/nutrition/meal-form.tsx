import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'

import { MEAL_TYPES, saveMeal, type MealEntry } from './api'
import { invalidateMeals } from './hooks'
import { mealSchema, normalizeMeal, type MealValues } from './schema'

const empty = (date: string): MealValues => ({
  log_date: date,
  meal_type: 'Breakfast',
  food: '',
  portion: '',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
  water_l: '',
  notes: '',
})

export function MealForm({
  date,
  editing,
  onSaved,
  onCancel,
}: {
  date: string
  editing?: MealEntry | null
  onSaved: (message: string) => void
  onCancel?: () => void
}) {
  const { user } = useAuth()
  const form = useForm<MealValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: editing
      ? {
          log_date: editing.log_date,
          meal_type: editing.meal_type,
          food: editing.food,
          portion: editing.portion ?? '',
          calories: editing.calories === null ? '' : String(editing.calories),
          protein_g: editing.protein_g === null ? '' : String(editing.protein_g),
          carbs_g: editing.carbs_g === null ? '' : String(editing.carbs_g),
          fat_g: editing.fat_g === null ? '' : String(editing.fat_g),
          water_l: editing.water_l === null ? '' : String(editing.water_l),
          notes: editing.notes ?? '',
        }
      : empty(date),
  })

  async function onSubmit(values: MealValues) {
    if (!user) return
    try {
      await saveMeal(user.id, { ...normalizeMeal(values), id: editing?.id })
      invalidateMeals(user.id)
      onSaved(editing ? 'Meal updated in the cloud.' : 'Meal saved to the cloud.')
      form.reset(empty(values.log_date))
    } catch (e) {
      form.setError('root', { message: e instanceof Error ? e.message : 'Failed to save meal.' })
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField control={form.control} name="log_date" render={({ field }) => (
            <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="meal_type" render={({ field }) => (
            <FormItem>
              <FormLabel>Meal</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{MEAL_TYPES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="food" render={({ field }) => (
            <FormItem className="sm:col-span-2"><FormLabel>Food & portion</FormLabel><FormControl><Input placeholder="e.g. Chicken breast, rice, broccoli" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="portion" render={({ field }) => (
            <FormItem><FormLabel>Portion</FormLabel><FormControl><Input placeholder="e.g. 150 g" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="calories" render={({ field }) => (
            <FormItem><FormLabel>Calories (kcal)</FormLabel><FormControl><Input type="number" inputMode="numeric" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="protein_g" render={({ field }) => (
            <FormItem><FormLabel>Protein (g)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="carbs_g" render={({ field }) => (
            <FormItem><FormLabel>Carbs (g)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="fat_g" render={({ field }) => (
            <FormItem><FormLabel>Fat (g)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="water_l" render={({ field }) => (
            <FormItem><FormLabel>Water (L)</FormLabel><FormControl><Input type="number" inputMode="decimal" step="0.1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        {form.formState.errors.root ? <p className="text-sm text-destructive">{form.formState.errors.root.message}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editing ? 'Update meal' : 'Add meal'}
          </Button>
          {onCancel ? <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button> : null}
        </div>
      </form>
    </Form>
  )
}
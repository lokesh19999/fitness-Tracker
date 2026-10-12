import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTheme, type Theme } from '@/components/theme-provider'
import { useAuth } from '@/hooks/use-auth'
import { useSettings } from '@/features/settings/hooks'
import { upsertSettings } from '@/features/settings/api'
import { invalidateSettings } from '@/features/settings/hooks'

const optionalNumber = (min: number, max: number, label: string) =>
  z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v === '' || (Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max),
      `${label} must be between ${min} and ${max}`,
    )

const schema = z.object({
  programme_start_date: z.string().min(1, 'Start date is required'),
  starting_weight_kg: optionalNumber(20, 400, 'Starting weight'),
  starting_waist_cm: optionalNumber(30, 250, 'Starting waist'),
  target_calories: optionalNumber(800, 6000, 'Calories'),
  target_protein_g: optionalNumber(20, 500, 'Protein'),
  target_carbs_g: optionalNumber(0, 1000, 'Carbohydrates'),
  target_fat_g: optionalNumber(0, 500, 'Fat'),
  target_water_l: optionalNumber(0, 20, 'Water'),
  target_steps: optionalNumber(0, 100000, 'Steps'),
  target_sleep_hours: optionalNumber(0, 24, 'Sleep'),
  goals: z.string().optional(),
  units: z.enum(['metric', 'imperial']),
  theme: z.enum(['light', 'dark', 'system']),
})

type SettingsValues = z.infer<typeof schema>

export function SettingsPage() {
  const { user } = useAuth()
  const { settings, loading } = useSettings()
  const { setTheme } = useTheme()
  const [message, setMessage] = useState<string | null>(null)

  const form = useForm<SettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(settings),
  })

  useEffect(() => {
    form.reset(buildDefaults(settings))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  async function onSubmit(values: SettingsValues) {
    if (!user) return
    const n = (v: string | undefined, fallback: number) => (v === '' || v === undefined ? fallback : Number(v))
    const nn = (v: string | undefined) => (v === '' || v === undefined ? null : Number(v))
    const payload = {
      programme_start_date: values.programme_start_date,
      starting_weight_kg: nn(values.starting_weight_kg),
      starting_waist_cm: nn(values.starting_waist_cm),
      target_calories: n(values.target_calories, settings.target_calories),
      target_protein_g: n(values.target_protein_g, settings.target_protein_g),
      target_carbs_g: n(values.target_carbs_g, settings.target_carbs_g),
      target_fat_g: n(values.target_fat_g, settings.target_fat_g),
      target_water_l: n(values.target_water_l, settings.target_water_l),
      target_steps: n(values.target_steps, settings.target_steps),
      target_sleep_hours: n(values.target_sleep_hours, settings.target_sleep_hours),
      goals: values.goals || null,
      units: values.units,
      theme: values.theme,
    }
    try {
      await upsertSettings(user.id, payload)
      invalidateSettings(user.id)
      setTheme(values.theme as Theme)
      setMessage('Settings saved. Historical records are preserved when targets change.')
    } catch (e) {
      form.setError('root', { message: e instanceof Error ? e.message : 'Save failed.' })
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading settings…</p>

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {message ? <div className="rounded-lg border bg-accent/40 px-4 py-2 text-sm text-accent-foreground">{message}</div> : null}

        <Card>
          <CardHeader><CardTitle className="text-sm">Programme</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="programme_start_date" render={({ field }) => (
              <FormItem><FormLabel>Programme start date</FormLabel><FormControl><Input type="date" {...field} /></FormControl>
                <FormDescription>Changing this shifts week numbering; existing records are kept.</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="starting_weight_kg" render={({ field }) => (
              <FormItem><FormLabel>Starting weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="starting_waist_cm" render={({ field }) => (
              <FormItem><FormLabel>Starting waist (cm)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="goals" render={({ field }) => (
              <FormItem className="sm:col-span-2"><FormLabel>Fitness goals</FormLabel><FormControl><Textarea placeholder="e.g. Build glutes, reduce waist, improve consistency" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Targets</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField control={form.control} name="target_calories" render={({ field }) => (
              <FormItem><FormLabel>Calories (kcal)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="target_protein_g" render={({ field }) => (
              <FormItem><FormLabel>Protein (g)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="target_carbs_g" render={({ field }) => (
              <FormItem><FormLabel>Carbohydrates (g)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="target_fat_g" render={({ field }) => (
              <FormItem><FormLabel>Fat (g)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="target_water_l" render={({ field }) => (
              <FormItem><FormLabel>Water (L)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="target_steps" render={({ field }) => (
              <FormItem><FormLabel>Steps</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="target_sleep_hours" render={({ field }) => (
              <FormItem><FormLabel>Sleep (hours)</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Preferences</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="units" render={({ field }) => (
              <FormItem><FormLabel>Units</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="metric">Metric (kg, cm)</SelectItem><SelectItem value="imperial">Imperial (lb, in)</SelectItem></SelectContent>
                </Select><FormDescription>Display preference only; values are stored in metric.</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="theme" render={({ field }) => (
              <FormItem><FormLabel>Theme</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="system">System</SelectItem></SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        {form.formState.errors.root ? <p className="text-sm text-destructive">{form.formState.errors.root.message}</p> : null}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save settings
        </Button>
      </form>
    </Form>
  )
}

function buildDefaults(s: ReturnType<typeof useSettings>['settings']): SettingsValues {
  return {
    programme_start_date: s.programme_start_date,
    starting_weight_kg: s.starting_weight_kg === null ? '' : String(s.starting_weight_kg),
    starting_waist_cm: s.starting_waist_cm === null ? '' : String(s.starting_waist_cm),
    target_calories: String(s.target_calories),
    target_protein_g: String(s.target_protein_g),
    target_carbs_g: String(s.target_carbs_g),
    target_fat_g: String(s.target_fat_g),
    target_water_l: String(s.target_water_l),
    target_steps: String(s.target_steps),
    target_sleep_hours: String(s.target_sleep_hours),
    goals: s.goals ?? '',
    units: s.units,
    theme: s.theme,
  }
}
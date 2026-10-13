import {
  Battery,
  CalendarRange,
  Drumstick,
  Dumbbell,
  Flame,
  Footprints,
  Moon,
  RefreshCw,
  Ruler,
  Scale,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { KpiCard } from '@/components/kpi-card'
import { ErrorState, KpiSkeletonGrid } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CaloriesTargetChart,
  EnergyFaceChart,
  MeasurementsChart,
  ProteinTargetChart,
  StepsSleepChart,
  StrengthChart,
  WeightTrendChart,
  WorkoutCompletionChart,
} from '@/features/dashboard/charts'
import { useDashboardData } from '@/features/dashboard/hooks'
import { useDailyLogs } from '@/features/daily-log/hooks'
import { useSettings } from '@/features/settings/hooks'
import { average, round } from '@/utils/calculations'
import { dateRangeForWeek, parseISODate, startOfWeek, toISODate } from '@/utils/dates'

const num = (v: number | null, unit = '', digits = 1) =>
  v === null || v === undefined ? '—' : `${v.toFixed(digits)}${unit}`

export function DashboardPage() {
  const { settings } = useSettings()
  const logsQ = useDailyLogs()

  const defaultFrom = useMemo(() => {
    const from = startOfWeek(new Date())
    from.setDate(from.getDate() - 7 * 8)
    return toISODate(from)
  }, [])
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(toISODate(new Date()))
  const [week, setWeek] = useState('all')

  const { data, loading, error, fetching, updatedAt, refresh } = useDashboardData({ from, to })
  const m = data.metrics

  const previousWeekChange = useMemo(() => {
    const thisStart = startOfWeek(new Date())
    const prevStart = new Date(thisStart)
    prevStart.setDate(prevStart.getDate() - 7)
    const inRange = (d: string, a: string, b?: string) => d >= a && (!b || d < b)
    const thisWeek = average(
      logsQ.logs.filter((l) => inRange(l.log_date, toISODate(thisStart))).map((l) => l.morning_weight_kg),
    )
    const prevWeek = average(
      logsQ.logs
        .filter((l) => inRange(l.log_date, toISODate(prevStart), toISODate(thisStart)))
        .map((l) => l.morning_weight_kg),
    )
    if (thisWeek === null || prevWeek === null) return null
    return round(thisWeek - prevWeek, 2)
  }, [logsQ.logs])

  function applyWeek(value: string) {
    setWeek(value)
    if (value === 'all') {
      setFrom(defaultFrom)
      setTo(toISODate(new Date()))
      return
    }
    const start = parseISODate(settings.programme_start_date)
    start.setDate(start.getDate() + (Number(value) - 1) * 7)
    const range = dateRangeForWeek(toISODate(start))
    setFrom(range.from)
    setTo(range.to)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 sm:flex sm:flex-wrap sm:items-end">
          <CalendarRange className="mb-2 hidden h-5 w-5 text-muted-foreground sm:block" />
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-none sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="from" className="text-xs">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-40" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to" className="text-xs">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-40" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Programme week</Label>
            <Select value={week} onValueChange={applyWeek}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All weeks</SelectItem>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i} value={String(i + 1)}>Week {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={refresh} disabled={fetching} className="w-full sm:ml-auto sm:w-auto">
            <RefreshCw className={fetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Refresh
          </Button>
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} onRetry={refresh} /> : null}

      {loading ? (
        <KpiSkeletonGrid count={12} />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <KpiCard label="Starting weight" value={num(m.startingWeight)} unit="kg" icon={<Scale className="h-4 w-4" />} />
          <KpiCard label="Latest weight" value={num(m.latestWeight)} unit="kg" delta={m.weightChange} icon={<Scale className="h-4 w-4" />} />
          <KpiCard
            label="Weight change"
            value={num(m.weightChange)}
            unit="kg"
            hint={`Prev week ${previousWeekChange === null ? '—' : `${previousWeekChange > 0 ? '+' : ''}${previousWeekChange} kg`}`}
          />
          <KpiCard label="Starting waist" value={num(m.startingWaist)} unit="cm" icon={<Ruler className="h-4 w-4" />} />
          <KpiCard label="Latest waist" value={num(m.latestWaist)} unit="cm" delta={m.waistChange} icon={<Ruler className="h-4 w-4" />} />
          <KpiCard label="Waist change" value={num(m.waistChange)} unit="cm" />
          <KpiCard label="Avg calories" value={num(m.avgCalories, '', 0)} unit="kcal" hint={`Target ${m.caloriesTarget}`} icon={<Flame className="h-4 w-4" />} />
          <KpiCard label="Avg protein" value={num(m.avgProtein, '', 0)} unit="g" hint={`Target ${m.proteinTarget}`} icon={<Drumstick className="h-4 w-4" />} />
          <KpiCard label="Workout completion" value={num(m.workoutCompletionPct)} unit="%" hint={`${m.workoutsCompleted}/${m.workoutsPlanned} sessions`} icon={<Dumbbell className="h-4 w-4" />} />
          <KpiCard label="Avg steps" value={num(m.avgSteps, '', 0)} icon={<Footprints className="h-4 w-4" />} />
          <KpiCard label="Avg sleep" value={num(m.avgSleep)} unit="h" icon={<Moon className="h-4 w-4" />} />
          <KpiCard label="Avg energy" value={num(m.avgEnergy)} unit="/5" icon={<Battery className="h-4 w-4" />} />
          <KpiCard label="Avg face/skin" value={num(m.avgFaceSkin)} unit="/5" icon={<Sparkles className="h-4 w-4" />} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <WeightTrendChart data={data.series.weight} />
        <MeasurementsChart data={data.series.measurements} />
        <CaloriesTargetChart data={data.series.calories} target={m.caloriesTarget} />
        <ProteinTargetChart data={data.series.protein} target={m.proteinTarget} />
        <StepsSleepChart data={data.series.stepsSleep} />
        <WorkoutCompletionChart data={data.series.workoutByWeek} />
        <EnergyFaceChart data={data.series.energyFace} />
        <StrengthChart data={data.series.strength} />
      </div>

      <p className="text-xs text-muted-foreground">
        Metrics are computed from your saved records only. Missing values are excluded, never treated as zero.
        {updatedAt ? ` Last updated ${new Date(updatedAt).toLocaleTimeString()}.` : ''}
      </p>
    </div>
  )
}